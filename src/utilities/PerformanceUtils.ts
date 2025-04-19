import {InteractionManager} from 'react-native';

/**
 * טיפוס ערך מטמון עם מטה-נתונים
 */
interface CacheEntry<T> {
  value: T;
  createdAt: number;
  lastAccessed?: number;
}

/**
 * אפשרויות מטמון
 */
interface CacheOptions {
  ttlMs?: number; // זמן תוקף במילישניות
  maxEntries?: number; // מספר מקסימלי של ערכים במטמון
  updateAccessTime?: boolean; // האם לעדכן זמן גישה אחרון
}

/**
 * מנהל מטמון אפליקציה - מטרתו לשפר את ביצועי האפליקציה באמצעות אחסון נתונים בזיכרון
 */
class AppCacheManager {
  private cache: Map<string, CacheEntry<any>>;
  private expirations: Map<string, number>;
  private maxEntries: number;

  constructor(maxEntries = 100) {
    this.cache = new Map();
    this.expirations = new Map();
    this.maxEntries = maxEntries;

    // נקה את המטמון בכל פעם שהאפליקציה עוברת לרקע
    this.setupCleanupListeners();
  }

  /**
   * התקנת מאזינים לניקוי מטמון
   */
  private setupCleanupListeners(): void {
    // בעתיד ניתן להוסיף כאן listener לאירועי AppState
    // לניקוי כאשר האפליקציה עוברת לרקע

    // ניקוי תקופתי אוטומטי של המטמון (כל דקה)
    setInterval(() => {
      this.cleanExpired();
    }, 60000);
  }

  /**
   * קבלת ערך מהמטמון
   * @param key - מפתח לחיפוש
   * @returns הערך המאוחסן, או undefined אם לא קיים או פג תוקף
   */
  get<T>(key: string, options?: {updateAccessTime?: boolean}): T | undefined {
    const now = Date.now();
    const expiry = this.expirations.get(key);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    // בדיקה אם פג תוקף
    if (expiry && now > expiry) {
      this.remove(key);
      return undefined;
    }

    if (!entry) {
      return undefined;
    }

    // עדכון זמן גישה אחרון אם צריך
    if (options?.updateAccessTime !== false) {
      entry.lastAccessed = now;
    }

    return entry.value;
  }

  /**
   * הוספת ערך למטמון עם אופציה לתוקף
   * @param key - מפתח לאחסון
   * @param value - הערך לאחסון
   * @param optionsOrTtl - אפשרויות מטמון (תוקף וכו') או זמן תוקף במילישניות
   */
  set<T>(key: string, value: T, optionsOrTtl?: number | CacheOptions): void {
    const now = Date.now();
    let ttlMs: number | undefined;
    let updateAccessTime = true;

    if (typeof optionsOrTtl === 'number') {
      ttlMs = optionsOrTtl;
    } else if (optionsOrTtl) {
      ttlMs = optionsOrTtl.ttlMs;
      updateAccessTime = optionsOrTtl.updateAccessTime ?? true;
    }

    // אם המטמון מלא, הסר את הערך הישן ביותר
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      this.removeOldest();
    }

    // הוספת הערך למטמון עם מטה-נתונים
    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      lastAccessed: updateAccessTime ? now : undefined,
    };

    this.cache.set(key, entry);

    // הגדרת זמן תפוגה אם צוין
    if (ttlMs) {
      this.expirations.set(key, now + ttlMs);
    } else if (this.expirations.has(key)) {
      // אם אין תוקף חדש אך היה תוקף קודם, הסר אותו
      this.expirations.delete(key);
    }

    return;
  }

  /**
   * הסרת הערך הישן ביותר מהמטמון (LRU - Least Recently Used)
   */
  private removeOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    // מצא את הערך עם זמן הגישה האחרון הוותיק ביותר
    for (const [key, entry] of this.cache.entries()) {
      const timeToCompare = entry.lastAccessed || entry.createdAt;
      if (timeToCompare < oldestTime) {
        oldestTime = timeToCompare;
        oldestKey = key;
      }
    }

    // הסר את הערך הישן ביותר
    if (oldestKey) {
      this.remove(oldestKey);
    }
  }

  /**
   * הסרת ערך מהמטמון
   * @param key - מפתח להסרה
   */
  remove(key: string): void {
    this.cache.delete(key);
    this.expirations.delete(key);
  }

  /**
   * ניקוי כל המטמון
   */
  clear(): void {
    this.cache.clear();
    this.expirations.clear();
  }

  /**
   * בדיקה האם מפתח קיים במטמון ותקף
   * @param key - מפתח לבדיקה
   */
  has(key: string): boolean {
    if (!this.cache.has(key)) {
      return false;
    }

    const now = Date.now();
    const expiry = this.expirations.get(key);

    // אם יש מועד תפוגה ופג התוקף
    if (expiry && now > expiry) {
      this.remove(key);
      return false;
    }

    return true;
  }

  /**
   * ניקוי ערכים שפג תוקפם
   */
  cleanExpired(): void {
    const now = Date.now();

    for (const [key, expiry] of this.expirations.entries()) {
      if (now > expiry) {
        this.remove(key);
      }
    }
  }

  /**
   * קבלת מספר הערכים במטמון
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * קבלת סטטיסטיקות המטמון
   */
  getStats(): {size: number; expirableEntries: number} {
    return {
      size: this.cache.size,
      expirableEntries: this.expirations.size,
    };
  }
}

/**
 * טיפוס תוצאות מדידת ביצועים
 */
interface PerformanceMeasurement {
  label: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
}

/**
 * מנהל ביצועים - מטרתו לשפר את ביצועי האפליקציה באמצעות דחיית משימות וניטור
 */
class PerformanceManager {
  private static measurements: PerformanceMeasurement[] = [];
  private static readonly MAX_MEASUREMENTS = 100;

  /**
   * ביצוע משימה כאשר האפליקציה פנויה
   * @param task - הפעולה לביצוע
   * @param timeout - משך זמן מקסימלי לחכות במילישניות
   * @returns הבטחה המתמלאת כאשר הפעולה מסתיימת
   */
  static runWhenIdle<T>(task: () => T, timeout = 300): Promise<T> {
    return new Promise<T>(resolve => {
      let isResolved = false;

      // ניסיון ראשון - חכה לסיום אינטראקציות
      InteractionManager.runAfterInteractions(() => {
        if (!isResolved) {
          isResolved = true;
          const result = task();
          resolve(result);
          return result;
        }
      });

      // גיבוי במקרה שהפעולה לא מסתיימת בזמן סביר
      if (timeout > 0) {
        setTimeout(() => {
          // בדוק אם ההבטחה כבר נפתרה
          if (!isResolved) {
            isResolved = true;
            const result = task();
            resolve(result);
          }
        }, timeout);
      }
    });
  }

  /**
   * מדידת זמן ביצוע של פעולה
   * @param fn - הפונקציה למדידה
   * @param label - שם לרישום בלוג
   * @returns התוצאה של הפונקציה
   */
  static measure<T>(fn: () => T, label = 'Operation'): T {
    const measurement: PerformanceMeasurement = {
      label,
      startTime: Date.now(),
    };

    try {
      const result = fn();
      const endTime = Date.now();

      measurement.endTime = endTime;
      measurement.duration = endTime - measurement.startTime;
      measurement.success = true;

      console.log(`⏱️ ${label}: ${measurement.duration}ms`);
      this.storeMeasurement(measurement);

      return result;
    } catch (error) {
      const endTime = Date.now();

      measurement.endTime = endTime;
      measurement.duration = endTime - measurement.startTime;
      measurement.success = false;

      console.log(`⏱️ ${label} (with error): ${measurement.duration}ms`);
      this.storeMeasurement(measurement);

      throw error;
    }
  }

  /**
   * מדידת זמן ביצוע של פעולה אסינכרונית
   * @param promiseFn - פונקציה אסינכרונית למדידה
   * @param label - שם לרישום בלוג
   * @returns ההבטחה המקורית
   */
  static async measureAsync<T>(promiseFn: () => Promise<T>, label = 'Async Operation'): Promise<T> {
    const measurement: PerformanceMeasurement = {
      label,
      startTime: Date.now(),
    };

    try {
      const result = await promiseFn();
      const endTime = Date.now();

      measurement.endTime = endTime;
      measurement.duration = endTime - measurement.startTime;
      measurement.success = true;

      console.log(`⏱️ ${label}: ${measurement.duration}ms`);
      this.storeMeasurement(measurement);

      return result;
    } catch (error) {
      const endTime = Date.now();

      measurement.endTime = endTime;
      measurement.duration = endTime - measurement.startTime;
      measurement.success = false;

      console.log(`⏱️ ${label} (with error): ${measurement.duration}ms`);
      this.storeMeasurement(measurement);

      throw error;
    }
  }

  /**
   * שמירת מדידת ביצועים
   */
  private static storeMeasurement(measurement: PerformanceMeasurement): void {
    this.measurements.push(measurement);

    // שמור רק מספר מוגבל של מדידות
    if (this.measurements.length > this.MAX_MEASUREMENTS) {
      this.measurements.shift(); // הסר את המדידה הישנה ביותר
    }
  }

  /**
   * קבלת היסטוריית מדידות
   */
  static getMeasurements(): PerformanceMeasurement[] {
    return [...this.measurements];
  }

  /**
   * קבלת סיכום ביצועים עבור תווית מסוימת
   * @param label - התווית לסינון (לא חובה)
   */
  static getPerformanceSummary(label?: string): {
    average: number;
    min: number;
    max: number;
    count: number;
    totalTime: number;
    successRate: number;
  } {
    const filteredMeasurements = label
      ? this.measurements.filter(m => m.label === label && m.duration !== undefined)
      : this.measurements.filter(m => m.duration !== undefined);

    if (filteredMeasurements.length === 0) {
      return {
        average: 0,
        min: 0,
        max: 0,
        count: 0,
        totalTime: 0,
        successRate: 0,
      };
    }

    // חישוב סטטיסטיקות
    const durations = filteredMeasurements.map(m => m.duration as number);
    const totalTime = durations.reduce((sum, duration) => sum + duration, 0);
    const successCount = filteredMeasurements.filter(m => m.success).length;

    return {
      average: totalTime / filteredMeasurements.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      count: filteredMeasurements.length,
      totalTime,
      successRate: (successCount / filteredMeasurements.length) * 100,
    };
  }

  /**
   * פונקציה חדשה: תזמון פעולה בקצב מוגבל
   * @param fn - הפונקציה לביצוע
   * @param delay - זמן השהייה במילישניות
   */
  static debounce<T extends (...args: any[]) => any>(
    fn: T,
    delay = 300,
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;

    return function (...args: Parameters<T>) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  /**
   * פונקציה חדשה: מניעת ביצוע חוזר של פעולה עד שחולף זמן מוגדר
   * @param fn - הפונקציה לביצוע
   * @param delay - זמן השהייה במילישניות
   */
  static throttle<T extends (...args: any[]) => any>(
    fn: T,
    delay = 300,
  ): (...args: Parameters<T>) => void {
    let wait = false;

    return function (...args: Parameters<T>) {
      if (wait) return;

      fn(...args);
      wait = true;
      setTimeout(() => {
        wait = false;
      }, delay);
    };
  }
}

// יצירת מופע יחיד של מנהל המטמון
export const AppCache = new AppCacheManager();

// ייצוא מנהל הביצועים
export const Performance = PerformanceManager;

// ייצוא כברירת מחדל
export default {
  AppCache,
  Performance,
};
