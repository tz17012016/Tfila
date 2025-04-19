import AsyncStorage from '@react-native-async-storage/async-storage';

// מפתחות אחסון
const LAST_REFRESH_KEY = '@tfila_last_refresh';
const REFRESH_PENDING_KEY = '@tfila_refresh_pending';
const REFRESH_HISTORY_KEY = '@tfila_refresh_history';

// זמן ברירת מחדל בדקות
const DEFAULT_REFRESH_INTERVAL = 60; // שעה

// מספר מרבי של רשומות היסטוריה
const MAX_HISTORY_ENTRIES = 10;

// טיפוס רשומת רענון
interface RefreshRecord {
  timestamp: string;
  success: boolean;
  source: string; // 'auto' | 'manual' | 'startup'
  duration?: number;
}

// ממשק עבור אפשרויות רענון
export interface RefreshOptions {
  intervalMinutes?: number; // כמות הדקות שאחריהן יש לרענן
  force?: boolean; // האם לכפות רענון ללא תלות בזמן
}

/**
 * מנהל הרענון - אחראי על בדיקה מתי צריך לרענן נתונים באופן אוטומטי
 */
class RefreshManager {
  /**
   * בדיקה האם יש צורך לרענן נתונים
   * @param intervalMinutes - כמות הדקות שאחריהן יש לרענן (ברירת מחדל: שעה)
   * @returns האם צריך לרענן
   */
  static async shouldRefreshData(intervalMinutes = DEFAULT_REFRESH_INTERVAL): Promise<boolean> {
    try {
      // בדיקה אם יש בקשת רענון ממוקדמת יותר
      const pendingRefresh = await AsyncStorage.getItem(REFRESH_PENDING_KEY);
      if (pendingRefresh === 'true') {
        return true;
      }

      // בדיקת זמן הרענון האחרון
      const lastRefresh = await AsyncStorage.getItem(LAST_REFRESH_KEY);
      if (!lastRefresh) {
        return true; // לא היה רענון קודם
      }

      const lastRefreshTime = new Date(lastRefresh).getTime();
      const now = Date.now();
      const diffMinutes = (now - lastRefreshTime) / (1000 * 60);

      return diffMinutes >= intervalMinutes;
    } catch (error) {
      console.error('Error checking refresh time:', error);
      return true; // במקרה של שגיאה, עדיף לרענן
    }
  }

  /**
   * בדיקת רענון עם אפשרויות מורחבות
   * @param options - אפשרויות רענון
   * @returns - האם צריך לרענן
   */
  static async shouldRefresh(options?: RefreshOptions): Promise<boolean> {
    const {intervalMinutes = DEFAULT_REFRESH_INTERVAL, force = false} = options || {};

    if (force) {
      return true;
    }

    return this.shouldRefreshData(intervalMinutes);
  }

  /**
   * עדכון זמן הרענון האחרון
   * @param source - מקור הרענון (אוטומטי, ידני, הפעלה)
   * @param duration - משך זמן הרענון במילישניות (אופציונלי)
   */
  static async markRefreshComplete(
    source: 'auto' | 'manual' | 'startup' = 'auto',
    duration?: number,
  ): Promise<void> {
    try {
      const now = new Date();
      const timestamp = now.toISOString();

      // שמירת הזמן העדכני
      await AsyncStorage.setItem(LAST_REFRESH_KEY, timestamp);
      await AsyncStorage.removeItem(REFRESH_PENDING_KEY);

      // הוספת רשומה להיסטוריה
      await this.addToRefreshHistory({
        timestamp,
        success: true,
        source,
        duration,
      });
    } catch (error) {
      console.error('Error updating last refresh time:', error);
    }
  }

  /**
   * הוספת רשומה להיסטוריית הרענונים
   * @param record - רשומת הרענון להוספה
   */
  private static async addToRefreshHistory(record: RefreshRecord): Promise<void> {
    try {
      // קריאת היסטוריה קיימת
      const historyJson = await AsyncStorage.getItem(REFRESH_HISTORY_KEY);
      const history: RefreshRecord[] = historyJson ? JSON.parse(historyJson) : [];

      // הוספת הרשומה החדשה בתחילת המערך
      history.unshift(record);

      // שמירה על מספר מוגבל של רשומות
      const trimmedHistory = history.slice(0, MAX_HISTORY_ENTRIES);

      // שמירת ההיסטוריה המעודכנת
      await AsyncStorage.setItem(REFRESH_HISTORY_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error updating refresh history:', error);
    }
  }

  /**
   * סימון שיש צורך ברענון בפתיחה הבאה
   */
  static async markRefreshNeeded(): Promise<void> {
    try {
      await AsyncStorage.setItem(REFRESH_PENDING_KEY, 'true');
    } catch (error) {
      console.error('Error marking refresh needed:', error);
    }
  }

  /**
   * סימון שרענון נכשל
   * @param source - מקור הרענון
   * @param duration - משך זמן הניסיון במילישניות
   */
  static async markRefreshFailed(
    source: 'auto' | 'manual' | 'startup' = 'auto',
    duration?: number,
  ): Promise<void> {
    try {
      // הוספת רשומה להיסטוריה עם סטטוס כישלון
      await this.addToRefreshHistory({
        timestamp: new Date().toISOString(),
        success: false,
        source,
        duration,
      });
    } catch (error) {
      console.error('Error marking refresh failure:', error);
    }
  }

  /**
   * קבלת זמן הרענון האחרון
   * @returns תאריך הרענון האחרון או null אם אין
   */
  static async getLastRefreshTime(): Promise<Date | null> {
    try {
      const lastRefresh = await AsyncStorage.getItem(LAST_REFRESH_KEY);
      return lastRefresh ? new Date(lastRefresh) : null;
    } catch (error) {
      console.error('Error getting last refresh time:', error);
      return null;
    }
  }

  /**
   * קבלת היסטוריית הרענונים
   * @returns מערך של רשומות רענון או מערך ריק אם אין היסטוריה
   */
  static async getRefreshHistory(): Promise<RefreshRecord[]> {
    try {
      const historyJson = await AsyncStorage.getItem(REFRESH_HISTORY_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Error getting refresh history:', error);
      return [];
    }
  }

  /**
   * חישוב זמן ממוצע של רענונים מוצלחים
   * @returns הזמן הממוצע במילישניות או null אם אין מספיק נתונים
   */
  static async getAverageRefreshDuration(): Promise<number | null> {
    try {
      const history = await this.getRefreshHistory();
      const successfulRefreshes = history.filter(
        record => record.success && typeof record.duration === 'number',
      );

      if (successfulRefreshes.length === 0) {
        return null;
      }

      const totalDuration = successfulRefreshes.reduce(
        (sum, record) => sum + (record.duration || 0),
        0,
      );

      return totalDuration / successfulRefreshes.length;
    } catch (error) {
      console.error('Error calculating average refresh duration:', error);
      return null;
    }
  }

  /**
   * קבלת מידע מלא על סטטוס הרענון
   * @returns - אובייקט עם מידע על סטטוס הרענון
   */
  static async getRefreshStatus(): Promise<{
    lastRefresh: Date | null;
    pendingRefresh: boolean;
    timeSinceLastRefreshMinutes: number | null;
  }> {
    try {
      const lastRefresh = await this.getLastRefreshTime();
      const pendingRefresh = (await AsyncStorage.getItem(REFRESH_PENDING_KEY)) === 'true';

      let timeSinceLastRefreshMinutes: number | null = null;
      if (lastRefresh) {
        const now = Date.now();
        const diffMs = now - lastRefresh.getTime();
        timeSinceLastRefreshMinutes = Math.floor(diffMs / (1000 * 60));
      }

      return {
        lastRefresh,
        pendingRefresh,
        timeSinceLastRefreshMinutes,
      };
    } catch (error) {
      console.error('Error getting refresh status:', error);
      return {
        lastRefresh: null,
        pendingRefresh: false,
        timeSinceLastRefreshMinutes: null,
      };
    }
  }
}

export default RefreshManager;
