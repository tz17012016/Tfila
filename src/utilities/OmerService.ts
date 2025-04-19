import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const HEBCAL_API_URL = 'https://www.hebcal.com/hebcal';
const OMER_CACHE_KEY = '@omer_data';
const OMER_CACHE_DATE_KEY = '@omer_cache_date';
const CACHE_EXPIRY_HOURS = 12; // Cache expires after 12 hours

// Interface for Omer data
export interface OmerItem {
  title: string; // Title of the event (e.g., "omer")
  date: string; // ISO date string
  hebrew: string; // Hebrew text for the omer count
  omer: number; // The omer day number (1-49)
  category: string; // Category from Hebcal API (typically "omer")
  fullOmerText: string; // Full Hebrew text for the omer count
  isToday: boolean; // Whether this is today's omer count
}

export interface OmerData {
  date: string; // Today's date in YYYY-MM-DD format
  todayOmer: OmerItem | null; // Today's omer information, if applicable
  nextOmer: OmerItem | null; // Next omer information, if today is not an omer day
  isOmerPeriod: boolean; // Whether we're currently in the omer counting period
}

/**
 * Service for fetching Omer counting information from Hebcal API
 */
export class OmerService {
  /**
   * Fetch the Omer information
   * @param forceRefresh - Force refresh from API ignoring cache
   * @returns Promise with Omer data
   */
  async getOmerData(forceRefresh = false): Promise<OmerData | null> {
    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedData = await this.getCachedData();
        if (cachedData) {
          console.log('Using cached Omer data');
          return cachedData;
        }
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

      // Fetch from API
      const url = this.buildApiUrl(todayStr, todayStr);
      console.log(`Fetching Omer data from: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Hebcal API error: ${response.status}`);
      }

      const data = await response.json();

      // Format the response data into our OmerData structure
      const omerData = this.formatOmerData(data, todayStr);

      // If no omer data was found for today, try to find the next omer day
      if (!omerData.todayOmer) {
        await this.findNextOmerDay(omerData);
      }

      // Cache the data
      await this.cacheData(omerData);

      return omerData;
    } catch (error) {
      console.error('Error fetching Omer data:', error);
      // Try to return cached data even if expired as fallback
      const cachedData = await this.getCachedData(true);
      return cachedData;
    }
  }

  /**
   * Find the next omer day if today is not an omer counting day
   * @param omerData - Current omer data object to update
   */
  private async findNextOmerDay(omerData: OmerData): Promise<void> {
    try {
      // If we're not in Omer period or already have today's data, skip
      if (omerData.todayOmer) return;

      const today = new Date();
      // Look up to 50 days ahead (covering the entire possible Omer period)
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 50);

      const startStr = today.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      // Make API request for the date range
      const url = this.buildApiUrl(startStr, endStr);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Hebcal API error: ${response.status}`);
      }

      const data = await response.json();

      // Find the first omer event in the response
      const omerItems = data.items?.filter((item: any) => item.category === 'omer') || [];

      if (omerItems.length > 0) {
        // Set the next omer day
        omerData.nextOmer = this.parseOmerItem(omerItems[0], false);
        // We're either before or after the omer period
        const nextDate = new Date(omerItems[0].date);
        // If next omer day is within 49 days, we're before the period
        // Otherwise, we're after and will need to wait until next year
        omerData.isOmerPeriod = nextDate.getTime() - today.getTime() < 49 * 24 * 60 * 60 * 1000;
      } else {
        omerData.isOmerPeriod = false;
      }
    } catch (error) {
      console.error('Error finding next omer day:', error);
    }
  }

  /**
   * Format the API response into structured OmerData
   * @param data - The API response data
   * @param todayStr - Today's date string in YYYY-MM-DD format
   */
  private formatOmerData(data: any, todayStr: string): OmerData {
    // Default structure
    const omerData: OmerData = {
      date: todayStr,
      todayOmer: null,
      nextOmer: null,
      isOmerPeriod: false,
    };

    // Check if the response has items and find Omer information
    if (data.items && Array.isArray(data.items)) {
      // Find omer event for today
      const omerEvent = data.items.find(
        (item: any) => item.category === 'omer' && item.date === todayStr,
      );

      if (omerEvent) {
        // We found an omer event for today
        omerData.todayOmer = this.parseOmerItem(omerEvent, true);
        omerData.isOmerPeriod = true;
      }
    }

    return omerData;
  }

  /**
   * Parse an omer item from the API response
   * @param item - The API item to parse
   * @param isToday - Whether this item is for today
   */
  private parseOmerItem(item: any, isToday: boolean): OmerItem {
    // Extract the omer day number from the title or desc
    let omerDay = 0;
    const matches = item.title.match(/Omer (\d+)/i);
    if (matches && matches[1]) {
      omerDay = parseInt(matches[1], 10);
    }

    // Create the full omer text in Hebrew
    let fullOmerText = '';
    if (item.hebrew) {
      const weeks = Math.floor(omerDay / 7);
      const days = omerDay % 7;

      // Format for Hebrew representation of omer count
      if (weeks === 0) {
        fullOmerText = `היום ${this.getHebrewDayNumber(omerDay)} לעומר`;
      } else if (days === 0) {
        fullOmerText = `היום ${this.getHebrewDayNumber(
          omerDay,
        )} לעומר, שהם ${this.getHebrewWeekNumber(weeks)} שבועות`;
      } else {
        fullOmerText = `היום ${this.getHebrewDayNumber(
          omerDay,
        )} לעומר, שהם ${this.getHebrewWeekNumber(weeks)} שבועות ו-${this.getHebrewDayNumber(
          days,
        )} ימים`;
      }
    }

    return {
      title: item.title || '',
      date: item.date || '',
      hebrew: item.hebrew || '',
      omer: omerDay,
      category: item.category || '',
      fullOmerText,
      isToday,
    };
  }

  /**
   * Get Hebrew representation of a day number
   * @param day - Day number to convert
   */
  private getHebrewDayNumber(day: number): string {
    const hebrewDays = [
      'אחד',
      'שניים',
      'שלושה',
      'ארבעה',
      'חמישה',
      'שישה',
      'שבעה',
      'שמונה',
      'תשעה',
      'עשרה',
      'אחד עשר',
      'שנים עשר',
      'שלושה עשר',
      'ארבעה עשר',
      'חמישה עשר',
      'שישה עשר',
      'שבעה עשר',
      'שמונה עשר',
      'תשעה עשר',
      'עשרים',
      'עשרים ואחד',
      'עשרים ושניים',
      'עשרים ושלושה',
      'עשרים וארבעה',
      'עשרים וחמישה',
      'עשרים ושישה',
      'עשרים ושבעה',
      'עשרים ושמונה',
      'עשרים ותשעה',
      'שלושים',
      'שלושים ואחד',
      'שלושים ושניים',
      'שלושים ושלושה',
      'שלושים וארבעה',
      'שלושים וחמישה',
      'שלושים ושישה',
      'שלושים ושבעה',
      'שלושים ושמונה',
      'שלושים ותשעה',
      'ארבעים',
      'ארבעים ואחד',
      'ארבעים ושניים',
      'ארבעים ושלושה',
      'ארבעים וארבעה',
      'ארבעים וחמישה',
      'ארבעים ושישה',
      'ארבעים ושבעה',
      'ארבעים ושמונה',
      'ארבעים ותשעה',
    ];

    return day > 0 && day <= 49 ? hebrewDays[day - 1] : '';
  }

  /**
   * Get Hebrew representation of a week number
   * @param week - Week number to convert
   */
  private getHebrewWeekNumber(week: number): string {
    const hebrewWeeks = ['שבוע', 'שבועיים', 'שלושה', 'ארבעה', 'חמישה', 'שישה', 'שבעה'];

    return week > 0 && week <= 7 ? hebrewWeeks[week - 1] : '';
  }

  /**
   * Build the API URL with all required parameters
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Fully formed API URL
   */
  private buildApiUrl(startDate: string, endDate: string): string {
    const params = new URLSearchParams({
      v: '1',
      cfg: 'json',
      o: 'on', // Include observed
      lg: 'h', // Hebrew language
      start: startDate,
      end: endDate,
    });

    return `${HEBCAL_API_URL}?${params.toString()}`;
  }

  /**
   * Clear the cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(OMER_CACHE_KEY);
      await AsyncStorage.removeItem(OMER_CACHE_DATE_KEY);
      console.log('Omer cache cleared');
    } catch (error) {
      console.error('Failed to clear Omer cache:', error);
    }
  }

  /**
   * Cache the Omer data
   * @param data - Data to cache
   */
  private async cacheData(data: OmerData): Promise<void> {
    try {
      await AsyncStorage.setItem(OMER_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(OMER_CACHE_DATE_KEY, new Date().toISOString());
      console.log('Omer data cached successfully');
    } catch (error) {
      console.error('Failed to cache Omer data:', error);
    }
  }

  /**
   * Check if cache is valid and retrieve cached data
   * @param ignoreExpiry - Ignore cache expiration (for fallbacks)
   * @returns Cached data or null if expired/not available
   */
  private async getCachedData(ignoreExpiry = false): Promise<OmerData | null> {
    try {
      // Check if cache exists
      const cachedDataStr = await AsyncStorage.getItem(OMER_CACHE_KEY);
      const cacheDateStr = await AsyncStorage.getItem(OMER_CACHE_DATE_KEY);

      if (!cachedDataStr || !cacheDateStr) {
        return null;
      }

      // Check if cache is expired
      if (!ignoreExpiry) {
        const cacheDate = new Date(cacheDateStr);
        const now = new Date();
        const diffMs = now.getTime() - cacheDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > CACHE_EXPIRY_HOURS) {
          console.log('Omer cache expired');
          return null;
        }
      }

      // Check if the date has changed since cache was created
      const cachedData: OmerData = JSON.parse(cachedDataStr);
      const today = new Date().toISOString().split('T')[0];

      // If today's date is different from cached date, consider cache expired
      if (cachedData.date !== today && !ignoreExpiry) {
        console.log('Omer cache date mismatch, expired');
        return null;
      }

      return cachedData;
    } catch (error) {
      console.error('Error retrieving Omer cached data:', error);
      return null;
    }
  }
}

// Export default instance
export default new OmerService();
