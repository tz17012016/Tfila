import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const HEBCAL_API_BASE_URL = 'https://www.hebcal.com/hebcal';
const HEBCAL_CACHE_KEY = '@hebcal_data';
const HEBCAL_CACHE_DATE_KEY = '@hebcal_cache_date';
const CACHE_EXPIRY_DAYS = 1; // Cache expires after 1 day

/**
 * Service for fetching Jewish calendar events from Hebcal API
 */
export class HebcalApiService {
  // Default location is Rosh Ha'Ayin, Israel (geonameid: 293690)
  private defaultGeoId = 293690;
  private language = 'he';
  private currentGeoId: number;

  constructor(geoId?: number) {
    this.currentGeoId = geoId || this.defaultGeoId;
  }

  /**
   * Set the geographic location ID
   * @param geoId - Hebcal geonameid
   */
  setLocation(geoId: number): void {
    this.currentGeoId = geoId;
    // Invalidate cache when location changes
    this.clearCache();
  }

  /**
   * Set the language for API responses
   * @param lang - Language code (he, en)
   */
  setLanguage(lang: string): void {
    if (['he', 'en'].includes(lang)) {
      this.language = lang;
      // Invalidate cache when language changes
      this.clearCache();
    }
  }

  /**
   * Fetch events from Hebcal API or from cache if available
   * @param forceRefresh - Force refresh from API ignoring cache
   * @returns Promise with Hebcal data
   */
  async getEvents(forceRefresh = false): Promise<any> {
    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedData = await this.getCachedData();
        if (cachedData) {
          console.log('Using cached Hebcal data');
          return cachedData;
        }
      }

      // Fetch from API
      const url = this.buildApiUrl();
      console.log(`Fetching Hebcal data from: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Hebcal API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the response
      await this.cacheData(data);

      return data;
    } catch (error) {
      console.error('Error fetching Hebcal events:', error);
      // Return cached data as fallback if available
      const cachedData = await this.getCachedData(true);
      if (cachedData) {
        console.log('Using cached data as fallback after error');
        return cachedData;
      }
      throw error;
    }
  }

  /**
   * Get events for today only
   * @returns Promise with today's events
   */
  async getTodayEvents(): Promise<any[]> {
    const data = await this.getEvents();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    return this.filterEventsByDate(data.items, todayStr);
  }

  /**
   * Get events for a specific date
   * @param date - Date to get events for
   * @returns Promise with events for the specified date
   */
  async getEventsByDate(date: Date): Promise<any[]> {
    const data = await this.getEvents();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    return this.filterEventsByDate(data.items, dateStr);
  }

  /**
   * Get all upcoming events (today and future)
   * @returns Promise with upcoming events
   */
  async getUpcomingEvents(): Promise<any[]> {
    const data = await this.getEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.items.filter(item => {
      const eventDate = new Date(item.date);
      return eventDate >= today;
    });
  }

  /**
   * Get this week's Torah portion
   * @returns Promise with this week's parasha info or null if not found
   */
  async getWeeklyParasha(): Promise<any | null> {
    const data = await this.getEvents();
    const today = new Date();
    const nextShabbat = this.getNextShabbat(today);
    const maxDate = new Date(nextShabbat);
    maxDate.setDate(maxDate.getDate() + 1); // Include Shabbat fully

    // Get events between today and next Shabbat
    const events = data.items.filter(item => {
      const eventDate = new Date(item.date);
      return eventDate >= today && eventDate < maxDate;
    });

    // Find parasha event (usually has category "parashat")
    return events.find(
      event => event.category === 'parashat' || (event.title && event.title.includes('פרשת')),
    );
  }

  /**
   * Clear the cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HEBCAL_CACHE_KEY);
      await AsyncStorage.removeItem(HEBCAL_CACHE_DATE_KEY);
      console.log('Hebcal cache cleared');
    } catch (error) {
      console.error('Failed to clear Hebcal cache:', error);
    }
  }

  /**
   * Build the API URL with all required parameters
   * @returns Fully formed API URL
   */
  private buildApiUrl(): string {
    const params = new URLSearchParams({
      v: '1',
      cfg: 'json',
      maj: 'on',
      min: 'on',
      mod: 'on',
      nx: 'on',
      year: 'now',
      month: 'x',
      ss: 'on',
      mf: 'on',
      c: 'on',
      geo: 'geoname',
      geonameid: this.currentGeoId.toString(),
      M: 'on',
      s: 'on',
      i: 'on',
      lg: this.language,
    });

    return `${HEBCAL_API_BASE_URL}?${params.toString()}`;
  }

  /**
   * Filter events by date
   * @param events - Array of events
   * @param dateStr - Date string in YYYY-MM-DD format
   * @returns Filtered events
   */
  private filterEventsByDate(events: any[], dateStr: string): any[] {
    return events.filter(item => {
      const itemDate = item.date.split('T')[0]; // Get YYYY-MM-DD part
      return itemDate === dateStr;
    });
  }

  /**
   * Get the date of the next Shabbat
   * @param fromDate - Starting date
   * @returns Date object for next Shabbat
   */
  private getNextShabbat(fromDate: Date): Date {
    const date = new Date(fromDate);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

    // If today is Shabbat and it's before sunset, return today
    if (dayOfWeek === 6) {
      return date;
    }

    // Otherwise, get next Shabbat
    const daysToAdd = (6 - dayOfWeek + 7) % 7;
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  /**
   * Cache the API response data
   * @param data - Data to cache
   */
  private async cacheData(data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(HEBCAL_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(HEBCAL_CACHE_DATE_KEY, new Date().toISOString());
      console.log('Hebcal data cached successfully');
    } catch (error) {
      console.error('Failed to cache Hebcal data:', error);
    }
  }

  /**
   * Check if cache is valid and retrieve cached data
   * @param ignoreExpiry - Ignore cache expiration (for fallbacks)
   * @returns Cached data or null if expired/not available
   */
  private async getCachedData(ignoreExpiry = false): Promise<any | null> {
    try {
      // Check if cache exists
      const cachedDataStr = await AsyncStorage.getItem(HEBCAL_CACHE_KEY);
      const cacheDateStr = await AsyncStorage.getItem(HEBCAL_CACHE_DATE_KEY);

      if (!cachedDataStr || !cacheDateStr) {
        return null;
      }

      // Check if cache is expired
      if (!ignoreExpiry) {
        const cacheDate = new Date(cacheDateStr);
        const now = new Date();
        const diffMs = now.getTime() - cacheDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays > CACHE_EXPIRY_DAYS) {
          console.log('Hebcal cache expired');
          return null;
        }
      }

      return JSON.parse(cachedDataStr);
    } catch (error) {
      console.error('Error retrieving Hebcal cached data:', error);
      return null;
    }
  }
}

// Export default instance with the default location
export default new HebcalApiService();
