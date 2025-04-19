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
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedData = await this.getCachedData();
        if (cachedData) {
          console.log('Using cached Zmanim data');
          return cachedData;
        }
      }

      // Fetch from API
      const url = this.buildApiUrl();
      console.log(`Fetching Zmanim data from: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Hebcal Zmanim API error: ${response.status}`);
      }

      const data = await response.json();

      // Format the response data into our ZmanimData structure
      const zmanimData = this.formatZmanimData(data);

      // Cache the data
      await this.cacheData(zmanimData);

      return zmanimData;
    } catch (error) {
      console.error('Error fetching Zmanim data:', error);
      // Try to return cached data even if expired as fallback
      const cachedData = await this.getCachedData(true);
      return cachedData;
    }
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
      await AsyncStorage.removeItem(ZMANIM_CACHE_KEY);
      await AsyncStorage.removeItem(ZMANIM_CACHE_DATE_KEY);
      console.log('Zmanim cache cleared');
    } catch (error) {
      console.error('Failed to clear Zmanim cache:', error);
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
      console.log('Zmanim data cached successfully');
    } catch (error) {
      console.error('Failed to cache Zmanim data:', error);
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
        return null;
      }

      // Check if cache is expired
      if (!ignoreExpiry) {
        const cacheDate = new Date(cacheDateStr);
        const now = new Date();
        const diffMs = now.getTime() - cacheDate.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours > CACHE_EXPIRY_HOURS) {
          console.log('Zmanim cache expired');
          return null;
        }
      }

      // Parse the cached data - no need to convert strings back to Date objects
      // as we'll use the timeString for display and parse the time string when needed
      return JSON.parse(cachedDataStr);
    } catch (error) {
      console.error('Error retrieving Zmanim cached data:', error);
      return null;
    }
  }
}

// Export default instance
export default new ZmanimService();
