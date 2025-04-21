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
    console.log(`HebcalApiService נוצר עם מזהה מיקום: ${this.currentGeoId}, שפה: ${this.language}`);
  }

  /**
   * Set the geographic location ID
   * @param geoId - Hebcal geonameid
   */
  setLocation(geoId: number): void {
    console.log(`שינוי מיקום מ-${this.currentGeoId} ל-${geoId}`);
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
      console.log(`שינוי שפה מ-${this.language} ל-${lang}`);
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
      console.group('🗓️ קבלת אירועי לוח שנה עברי');
      console.log(`מצב: ${forceRefresh ? 'מאלץ רענון מהשרת' : 'בודק מטמון תחילה'}`);

      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedData = await this.getCachedData();
        if (cachedData) {
          console.log('✅ נמצא מידע במטמון תקף');
          this.logDataSummary(cachedData, 'מטמון');
          console.groupEnd();
          return cachedData;
        }
      }

      // Fetch from API
      const url = this.buildApiUrl();
      console.log(`🔄 מתחבר ל-API בכתובת: ${url}`);

      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();

      console.log(`⏱️ זמן תגובת שרת: ${endTime - startTime}ms`);
      console.log(`קוד תשובה: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        throw new Error(`Hebcal API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📦 נתונים התקבלו בהצלחה מהשרת`);

      // Log data summary
      this.logDataSummary(data, 'שרת');

      // Cache the response
      await this.cacheData(data);

      console.groupEnd();
      return data;
    } catch (error) {
      console.error('❌ שגיאה בקבלת אירועים:', error);

      // Return cached data as fallback if available
      const cachedData = await this.getCachedData(true);
      if (cachedData) {
        console.log('⚠️ משתמש בנתונים מהמטמון כגיבוי לאחר שגיאה');
        this.logDataSummary(cachedData, 'מטמון (גיבוי)');
        console.groupEnd();
        return cachedData;
      }
      console.groupEnd();
      throw error;
    }
  }

  /**
   * Get events for today only
   * @returns Promise with today's events
   */
  async getTodayEvents(): Promise<any[]> {
    console.group('🔍 קבלת אירועים להיום');
    const data = await this.getEvents();
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    const events = this.filterEventsByDate(data.items, todayStr);
    console.log(`נמצאו ${events.length} אירועים להיום (${todayStr})`);

    if (events.length > 0) {
      console.log(
        'רשימת אירועים:',
        events.map(e => e.title || e.hebrew || e.description).join(', '),
      );
    }

    console.groupEnd();
    return events;
  }

  /**
   * Get events for a specific date
   * @param date - Date to get events for
   * @returns Promise with events for the specified date
   */
  async getEventsByDate(date: Date): Promise<any[]> {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    console.group(`🔍 קבלת אירועים לתאריך ${dateStr}`);

    const data = await this.getEvents();
    const events = this.filterEventsByDate(data.items, dateStr);

    console.log(`נמצאו ${events.length} אירועים לתאריך ${dateStr}`);
    if (events.length > 0) {
      console.log(
        'רשימת אירועים:',
        events.map(e => e.title || e.hebrew || e.description).join(', '),
      );
    }

    console.groupEnd();
    return events;
  }

  /**
   * Get all upcoming events (today and future)
   * @returns Promise with upcoming events
   */
  async getUpcomingEvents(): Promise<any[]> {
    console.group('🔍 קבלת אירועים עתידיים');

    const data = await this.getEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = data.items.filter(item => {
      const eventDate = new Date(item.date);
      return eventDate >= today;
    });

    console.log(`נמצאו ${events.length} אירועים עתידיים`);

    // Log first 5 upcoming events
    if (events.length > 0) {
      const firstFiveEvents = events.slice(0, 5);
      console.log('חמשת האירועים הקרובים:');
      firstFiveEvents.forEach(event => {
        const eventDate = new Date(event.date);
        console.log(
          `- ${eventDate.toLocaleDateString('he-IL')}: ${
            event.title || event.hebrew || event.description
          }`,
        );
      });

      if (events.length > 5) {
        console.log(`...ועוד ${events.length - 5} אירועים`);
      }
    }

    console.groupEnd();
    return events;
  }

  /**
   * Get this week's Torah portion
   * @returns Promise with this week's parasha info or null if not found
   */
  async getWeeklyParasha(): Promise<any | null> {
    console.group('🔍 קבלת פרשת השבוע');

    const data = await this.getEvents();
    const today = new Date();
    const nextShabbat = this.getNextShabbat(today);
    const maxDate = new Date(nextShabbat);
    maxDate.setDate(maxDate.getDate() + 1); // Include Shabbat fully

    console.log(
      `מחפש פרשה בין ${today.toLocaleDateString('he-IL')} לבין ${maxDate.toLocaleDateString(
        'he-IL',
      )}`,
    );

    // Get events between today and next Shabbat
    const events = data.items.filter(item => {
      const eventDate = new Date(item.date);
      return eventDate >= today && eventDate < maxDate;
    });

    // Find parasha event (usually has category "parashat")
    const parasha = events.find(
      event => event.category === 'parashat' || (event.title && event.title.includes('פרשת')),
    );

    if (parasha) {
      console.log(`🕮 נמצאה פרשת השבוע: ${parasha.title || parasha.hebrew}`);
      console.log('פרטי הפרשה:', JSON.stringify(parasha, null, 2));
    } else {
      console.log('❌ לא נמצאה פרשת שבוע');
    }

    console.groupEnd();
    return parasha;
  }

  /**
   * Clear the cached data
   */
  async clearCache(): Promise<void> {
    try {
      console.group('🗑️ ניקוי מטמון');
      await AsyncStorage.removeItem(HEBCAL_CACHE_KEY);
      await AsyncStorage.removeItem(HEBCAL_CACHE_DATE_KEY);
      console.log('✅ מטמון נוקה בהצלחה');
      console.groupEnd();
    } catch (error) {
      console.error('❌ שגיאה בניקוי מטמון:', error);
      console.groupEnd();
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
      console.log('✅ נתונים נשמרו במטמון בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בשמירת נתונים במטמון:', error);
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
        console.log('לא נמצא מטמון');
        return null;
      }

      // Check if cache is expired
      if (!ignoreExpiry) {
        const cacheDate = new Date(cacheDateStr);
        const now = new Date();
        const diffMs = now.getTime() - cacheDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        const diffHours = diffMs / (1000 * 60 * 60);

        console.log(`מטמון נוצר לפני: ${Math.floor(diffHours)} שעות (${diffDays.toFixed(2)} ימים)`);
        console.log(`תוקף מטמון: ${CACHE_EXPIRY_DAYS} ימים`);

        if (diffDays > CACHE_EXPIRY_DAYS) {
          console.log('⚠️ המטמון פג תוקף');
          return null;
        }
      }

      return JSON.parse(cachedDataStr);
    } catch (error) {
      console.error('❌ שגיאה באחזור נתונים מהמטמון:', error);
      return null;
    }
  }

  /**
   * Log a summary of the data received
   * @param data - Data to summarize
   * @param source - Source of the data (cache or API)
   */
  private logDataSummary(data: any, source: string): void {
    if (!data || !data.items) {
      console.log(`❌ אין נתונים תקפים מ${source}`);
      return;
    }

    const totalEvents = data.items.length;
    const categories = new Set();
    const monthCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    // הוספת תאריך העדכון האחרון
    const lastUpdateDate = data.date || 'לא זמין';

    // Count events by category, month, and type
    data.items.forEach((item: any) => {
      if (item.category) {
        categories.add(item.category);
        typeCounts[item.category] = (typeCounts[item.category] || 0) + 1;
      }

      if (item.date) {
        const month = new Date(item.date).getMonth() + 1;
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });

    console.group(`📊 סיכום נתונים (מקור: ${source})`);
    console.log(`סך הכל אירועים: ${totalEvents}`);
    console.log(`תאריך העדכון האחרון: ${lastUpdateDate}`);
    console.log(`קטגוריות: ${Array.from(categories).join(', ')}`);

    // Log distribution by type
    console.log('התפלגות לפי סוג:');
    Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1]) // Sort by count in descending order
      .forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} (${((count / totalEvents) * 100).toFixed(1)}%)`);
      });

    // Log distribution by month
    console.log('התפלגות לפי חודש:');
    for (let i = 1; i <= 12; i++) {
      if (monthCounts[i]) {
        console.log(`  - חודש ${i}: ${monthCounts[i]} אירועים`);
      }
    }

    console.groupEnd();
  }
}

// Export default instance with the default location
export default new HebcalApiService();
