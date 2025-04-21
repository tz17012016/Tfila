import AsyncStorage from '@react-native-async-storage/async-storage';
import {formatTimeForDisplay} from './timeUtils';

// Constants
const HEBCAL_ZMANIM_API_URL = 'https://www.hebcal.com/zmanim';
const ZMANIM_CACHE_KEY = '@zmanim_data';
const ZMANIM_CACHE_DATE_KEY = '@zmanim_cache_date';
const CACHE_EXPIRY_HOURS = 12; // Cache expires after 12 hours

// Interface for Zmanim data
export interface ZmanimItem {
  title: string;
  // Store time as ISO string for serialization
  time: string;
  timeString: string;
  category?: string;
  description?: string;
}

export interface ZmanimData {
  date: string;
  items: ZmanimItem[];
  hebrewDate: string;
  location: {
    name: string;
    latitude: number;
    longitude: number;
    tzid: string;
  };
}

/**
 * Service for fetching daily zmanim (halachic times) information from Hebcal API
 */
export class ZmanimService {
  /**
   * Fetch the daily zmanim information
   * @param forceRefresh - Force refresh from API ignoring cache
   * @returns Promise with Zmanim data
   */
  async getZmanimData(forceRefresh = false): Promise<ZmanimData | null> {
    try {
      console.group('⏰ בקשת זמני תפילה');
      console.log(`מצב: ${forceRefresh ? 'מאלץ רענון מהשרת' : 'בודק מטמון תחילה'}`);

      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedData = await this.getCachedData();
        if (cachedData) {
          console.log('✅ נמצא מידע במטמון תקף');
          this.logZmanimSummary(cachedData, 'מטמון');
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
        throw new Error(`Hebcal Zmanim API error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📦 נתונים התקבלו בהצלחה מהשרת`);

      // Format the response data into our ZmanimData structure
      const zmanimData = this.formatZmanimData(data);

      // Log summary of zmanim received
      this.logZmanimSummary(zmanimData, 'שרת');

      // Cache the data
      await this.cacheData(zmanimData);

      console.groupEnd();
      return zmanimData;
    } catch (error) {
      console.error('❌ שגיאה בקבלת זמני תפילה:', error);

      // Try to return cached data even if expired as fallback
      const cachedData = await this.getCachedData(true);
      if (cachedData) {
        console.log('⚠️ משתמש בנתונים מהמטמון כגיבוי לאחר שגיאה');
        this.logZmanimSummary(cachedData, 'מטמון (גיבוי)');
      } else {
        console.log('❌ אין נתונים זמינים במטמון לגיבוי');
      }

      console.groupEnd();
      return cachedData;
    }
  }

  /**
   * Log summary of zmanim data
   * @param data - The zmanim data to summarize
   * @param source - Source of the data (cache or API)
   */
  private logZmanimSummary(data: ZmanimData, source: string): void {
    if (!data || !data.items) {
      console.log(`❌ אין נתוני זמני תפילה תקפים מ${source}`);
      return;
    }

    console.group(`📊 סיכום זמני תפילה (מקור: ${source})`);

    // Log basic info
    console.log(`תאריך: ${data.date}`);
    console.log(`תאריך עברי: ${data.hebrewDate}`);
    console.log(
      `מיקום: ${data.location.name} (${data.location.latitude}, ${data.location.longitude})`,
    );
    console.log(`אזור זמן: ${data.location.tzid}`);

    // Count zmanim by category
    const totalZmanim = data.items.length;
    console.log(`סך הכל זמנים: ${totalZmanim}`);

    // Group zmanim by part of day
    const morning: ZmanimItem[] = [];
    const midday: ZmanimItem[] = [];
    const evening: ZmanimItem[] = [];

    data.items.forEach(item => {
      const timeDate = new Date(item.time);
      const hours = timeDate.getHours();

      if (hours < 12) {
        morning.push(item);
      } else if (hours < 17) {
        midday.push(item);
      } else {
        evening.push(item);
      }
    });

    // Log key zmanim in order of the day
    console.log('\n⛅ זמני בוקר:');
    morning.forEach(item => {
      console.log(`  - ${item.title}: ${item.timeString}`);
    });

    console.log('\n☀️ זמני צהריים:');
    midday.forEach(item => {
      console.log(`  - ${item.title}: ${item.timeString}`);
    });

    console.log('\n🌙 זמני ערב:');
    evening.forEach(item => {
      console.log(`  - ${item.title}: ${item.timeString}`);
    });

    // Find special zmanim
    const specialZmanim = ['הדלקת נרות', 'צאת השבת', 'צאת הכוכבים'];
    const foundSpecial = data.items.filter(item => specialZmanim.some(z => item.title.includes(z)));

    if (foundSpecial.length > 0) {
      console.log('\n✨ זמנים מיוחדים:');
      foundSpecial.forEach(item => {
        console.log(`  - ${item.title}: ${item.timeString}`);
      });
    }

    console.groupEnd();
  }

  /**
   * Format the API response into structured ZmanimData
   */
  private formatZmanimData(data: any): ZmanimData {
    // Extract location information
    const location = {
      name: data.location.name || 'ישראל',
      latitude: data.location.latitude || 0,
      longitude: data.location.longitude || 0,
      tzid: data.location.tzid || 'Asia/Jerusalem',
    };

    // Extract Hebrew date
    const hebrewDate = data.date || '';

    // Extract and format zmanim items
    const items: ZmanimItem[] = [];

    // Process the different zmanim types
    if (data.times) {
      // Map Hebrew titles for common zmanim
      const titleMapping: Record<string, string> = {
        sunrise: 'הנץ החמה',
        sunset: 'שקיעה',
        dawn: 'עלות השחר',
        dusk: 'צאת הכוכבים',
        midday: 'חצות היום',
        midnight: 'חצות הלילה',
        candleLighting: 'הדלקת נרות',
        seaLevelSunrise: 'הנץ החמה (מישור)',
        seaLevelSunset: 'שקיעה (מישור)',
        shaahZmanit: 'שעה זמנית',
        alotHaShachar: 'עלות השחר',
        misheyakir: 'משיכיר',
        misheyakirMachmir: 'משיכיר (מחמיר)',
        sofZmanShma: 'סוף זמן ק"ש (גר"א)',
        sofZmanShmaMGA: 'סוף זמן ק"ש (מג"א)',
        sofZmanTfilla: 'סוף זמן תפילה (גר"א)',
        sofZmanTfillaMGA: 'סוף זמן תפילה (מג"א)',
        minchaGedola: 'מנחה גדולה',
        minchaKetana: 'מנחה קטנה',
        plagHaMincha: 'פלג המנחה',
        tzeit7083deg: 'צאת הכוכבים (7.083°)',
        tzeit85deg: 'צאת הכוכבים (8.5°)',
        tzeit42min: 'צאת השבת (42 דק׳)',
        tzeit50min: 'צאת השבת (50 דק׳)',
        tzeit72min: 'צאת השבת (72 דק׳)',
        tzeitTaanit: 'צאת התענית',
        shaalot: 'שעלות',
        sunriseElevation: 'הנץ (התאמת גובה)',
      };

      // Log all original zmanim keys for debugging
      console.log('מפתחות זמנים מקוריים מה-API:', Object.keys(data.times));

      // Process each time entry
      Object.entries(data.times).forEach(([key, value]) => {
        if (typeof value === 'string') {
          const timeDate = new Date(value);

          items.push({
            title: titleMapping[key] || key,
            // Store as string for serialization
            time: timeDate.toISOString(),
            timeString: formatTimeForDisplay(timeDate),
            category: 'zmanim',
            description: `זמן ${titleMapping[key] || key}`,
          });
        }
      });
    }

    // Sort items by time - convert strings to Date temporarily for sorting
    items.sort((a, b) => {
      const dateA = new Date(a.time);
      const dateB = new Date(b.time);
      return dateA.getTime() - dateB.getTime();
    });

    return {
      date: data.date || new Date().toISOString().split('T')[0],
      items,
      hebrewDate,
      location,
    };
  }

  /**
   * Clear the cached data
   */
  async clearCache(): Promise<void> {
    try {
      console.group('🗑️ ניקוי מטמון זמני תפילה');
      await AsyncStorage.removeItem(ZMANIM_CACHE_KEY);
      await AsyncStorage.removeItem(ZMANIM_CACHE_DATE_KEY);
      console.log('✅ מטמון זמני תפילה נוקה בהצלחה');
      console.groupEnd();
    } catch (error) {
      console.error('❌ שגיאה בניקוי מטמון זמני תפילה:', error);
      console.groupEnd();
    }
  }

  /**
   * Build the API URL with all required parameters
   * @returns Fully formed API URL
   */
  private buildApiUrl(): string {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    const params = new URLSearchParams({
      cfg: 'json',
      geonameid: '293690', // Rosh Ha'Ayin, Israel
      date: dateString, // Today's date
    });

    return `${HEBCAL_ZMANIM_API_URL}?${params.toString()}`;
  }

  /**
   * Cache the Zmanim data
   * @param data - Data to cache
   */
  private async cacheData(data: ZmanimData): Promise<void> {
    try {
      await AsyncStorage.setItem(ZMANIM_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(ZMANIM_CACHE_DATE_KEY, new Date().toISOString());
      console.log('✅ נתוני זמני תפילה נשמרו במטמון בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בשמירת נתוני זמני תפילה במטמון:', error);
    }
  }

  /**
   * Check if cache is valid and retrieve cached data
   * @param ignoreExpiry - Ignore cache expiration (for fallbacks)
   * @returns Cached data or null if expired/not available
   */
  private async getCachedData(ignoreExpiry = false): Promise<ZmanimData | null> {
    try {
      // Check if cache exists
      const cachedDataStr = await AsyncStorage.getItem(ZMANIM_CACHE_KEY);
      const cacheDateStr = await AsyncStorage.getItem(ZMANIM_CACHE_DATE_KEY);

      if (!cachedDataStr || !cacheDateStr) {
        console.log('לא נמצא מטמון זמני תפילה');
        return null;
      }

      // Check if cache is expired
      if (!ignoreExpiry) {
        const cacheDate = new Date(cacheDateStr);
        const now = new Date();
        const diffMs = now.getTime() - cacheDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);
        const diffMinutes = Math.floor((diffHours - Math.floor(diffHours)) * 60);

        console.log(
          `מטמון זמני תפילה נוצר לפני: ${Math.floor(diffHours)} שעות ו-${diffMinutes} דקות`,
        );
        console.log(`תוקף מטמון: ${CACHE_EXPIRY_HOURS} שעות`);

        if (diffHours > CACHE_EXPIRY_HOURS) {
          console.log('⚠️ מטמון זמני תפילה פג תוקף');
          return null;
        }
      }

      // Parse the cached data
      return JSON.parse(cachedDataStr);
    } catch (error) {
      console.error('❌ שגיאה באחזור נתוני זמני תפילה מהמטמון:', error);
      return null;
    }
  }

  /**
   * Get zmanim for a specific date
   * @param date - Date to get zmanim for
   * @returns Promise with zmanim data for the specified date
   */
  async getZmanimForDate(date: Date): Promise<ZmanimData | null> {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    console.group(`⏰ בקשת זמני תפילה לתאריך ${dateString}`);

    try {
      const url = this.buildApiUrlForDate(date);
      console.log(`🔄 מתחבר ל-API בכתובת: ${url}`);

      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();

      console.log(`⏱️ זמן תגובת שרת: ${endTime - startTime}ms`);

      if (!response.ok) {
        throw new Error(`Hebcal Zmanim API error: ${response.status}`);
      }

      const data = await response.json();
      const zmanimData = this.formatZmanimData(data);

      // Log summary of zmanim received
      this.logZmanimSummary(zmanimData, 'שרת (תאריך ספציפי)');

      console.groupEnd();
      return zmanimData;
    } catch (error) {
      console.error(`❌ שגיאה בקבלת זמני תפילה לתאריך ${dateString}:`, error);
      console.groupEnd();
      return null;
    }
  }

  /**
   * Build API URL for a specific date
   * @param date - Date to get zmanim for
   * @returns API URL
   */
  private buildApiUrlForDate(date: Date): string {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    const params = new URLSearchParams({
      cfg: 'json',
      geonameid: '293690', // Rosh Ha'Ayin, Israel
      date: dateString,
    });

    return `${HEBCAL_ZMANIM_API_URL}?${params.toString()}`;
  }
}

// Export default instance
export default new ZmanimService();
