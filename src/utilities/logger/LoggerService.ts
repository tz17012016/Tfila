import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const LOG_STORAGE_KEY = '@tfila_app_logs';
const MAX_LOGS_TO_STORE = 500;

// Log Levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log Entry Interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string;
  data?: any;
  stackTrace?: string;
}

// Categories for grouping logs
export enum LogCategory {
  API = 'API',
  NETWORK = 'NETWORK',
  ZMANIM = 'ZMANIM',
  HEBCAL = 'HEBCAL',
  CACHE = 'CACHE',
  USER = 'USER',
  NAVIGATION = 'NAVIGATION',
  GENERAL = 'GENERAL',
}

/**
 * שירות לוגים מרכזי של האפליקציה
 * מאפשר רישום לוגים מפורטים, שמירתם למאגר מקומי וניתוח סטטיסטי שלהם
 */
class LoggerService {
  private static instance: LoggerService;
  private logs: LogEntry[] = [];
  private isInitialized = false;
  private verboseMode = __DEV__; // Verbose logging in development mode by default
  private consoleOutput = true;

  /**
   * מאפשר גישה ליחידה אחת של שירות הלוגים (סינגלטון)
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * אתחול שירות הלוגים
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.group('🔄 אתחול שירות לוגים');

      // טעינת לוגים קיימים מהמאגר המקומי
      const storedLogs = await AsyncStorage.getItem(LOG_STORAGE_KEY);
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs);
        console.log(`📋 נטענו ${this.logs.length} רשומות לוג קיימות מהמאגר המקומי`);
      }

      console.log('✅ שירות הלוגים אותחל בהצלחה');
      this.isInitialized = true;

      // רישום לוג ראשון של אתחול המערכת
      this.info('GENERAL', 'שירות הלוגים אותחל', {
        timestamp: new Date().toISOString(),
      });

      console.groupEnd();
    } catch (error) {
      console.error('❌ שגיאה באתחול שירות הלוגים:', error);
      this.isInitialized = true; // נגדיר כמאותחל בכל מקרה כדי למנוע ניסיונות חוזרים
    }
  }

  /**
   * שינוי הגדרות שירות הלוגים
   * @param options - אפשרויות קונפיגורציה
   */
  public configure(options: {verbose?: boolean; consoleOutput?: boolean}): void {
    if (options.verbose !== undefined) this.verboseMode = options.verbose;
    if (options.consoleOutput !== undefined) this.consoleOutput = options.consoleOutput;

    this.info('GENERAL', 'הגדרות הלוגים עודכנו', {
      verbose: this.verboseMode,
      consoleOutput: this.consoleOutput,
    });
  }

  /**
   * רישום לוג ברמת DEBUG
   * @param module - שם המודול/קטגוריה
   * @param message - הודעת הלוג
   * @param data - נתונים נוספים אופציונליים
   */
  public debug(module: string, message: string, data?: any): void {
    if (!this.verboseMode) return; // הצג רק במצב מפורט
    this.log(LogLevel.DEBUG, module, message, data);
  }

  /**
   * רישום לוג ברמת INFO
   * @param module - שם המודול/קטגוריה
   * @param message - הודעת הלוג
   * @param data - נתונים נוספים אופציונליים
   */
  public info(module: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, module, message, data);
  }

  /**
   * רישום לוג ברמת WARNING
   * @param module - שם המודול/קטגוריה
   * @param message - הודעת הלוג
   * @param data - נתונים נוספים אופציונליים
   */
  public warn(module: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, module, message, data);
  }

  /**
   * רישום לוג ברמת ERROR
   * @param module - שם המודול/קטגוריה
   * @param message - הודעת הלוג
   * @param data - נתונים נוספים אופציונליים
   * @param error - אובייקט שגיאה אופציונלי
   */
  public error(module: string, message: string, data?: any, error?: Error): void {
    let stackTrace: string | undefined;

    if (error && error.stack) {
      stackTrace = error.stack;
    }

    this.log(LogLevel.ERROR, module, message, data, stackTrace);
  }

  /**
   * מחזיר את כל הלוגים השמורים
   */
  public getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * מחזיר לוגים מסוננים לפי רמה
   * @param level - רמת הלוג לסינון
   */
  public getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * מחזיר לוגים מסוננים לפי מודול
   * @param module - שם המודול לסינון
   */
  public getLogsByModule(module: string): LogEntry[] {
    return this.logs.filter(log => log.module === module);
  }

  /**
   * מחזיר סיכום סטטיסטי של הלוגים
   */
  public getLogsSummary(): Record<string, any> {
    const summary = {
      total: this.logs.length,
      byLevel: {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
      },
      byModule: {} as Record<string, number>,
      errorsCount: 0,
      latestTimestamp: this.logs.length > 0 ? this.logs[0].timestamp : null,
      oldestTimestamp: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
    };

    // חישוב סטטיסטיקה
    this.logs.forEach(log => {
      // ספירה לפי רמה
      summary.byLevel[log.level]++;

      // ספירה לפי מודול
      if (!summary.byModule[log.module]) {
        summary.byModule[log.module] = 0;
      }
      summary.byModule[log.module]++;

      // ספירת שגיאות
      if (log.level === LogLevel.ERROR) {
        summary.errorsCount++;
      }
    });

    return summary;
  }

  /**
   * ניקוי הלוגים
   */
  public async clearLogs(): Promise<void> {
    this.logs = [];
    try {
      await AsyncStorage.removeItem(LOG_STORAGE_KEY);
      console.log('✅ כל הלוגים נוקו בהצלחה');
    } catch (error) {
      console.error('❌ שגיאה בניקוי הלוגים:', error);
    }
  }

  /**
   * הוספת לוג למאגר
   * @param level - רמת הלוג
   * @param module - שם המודול
   * @param message - הודעת הלוג
   * @param data - נתונים נוספים אופציונליים
   * @param stackTrace - מחסנית קריאות אופציונלית לשגיאות
   */
  private log(
    level: LogLevel,
    module: string,
    message: string,
    data?: any,
    stackTrace?: string,
  ): void {
    if (!this.isInitialized) {
      this.initialize();
    }

    // יצירת רשומת לוג חדשה
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      module,
      data,
      stackTrace,
    };

    // הוספת הלוג לתחילת המערך (הלוג האחרון יהיה ראשון)
    this.logs.unshift(logEntry);

    // הגבלת גודל מאגר הלוגים
    if (this.logs.length > MAX_LOGS_TO_STORE) {
      this.logs = this.logs.slice(0, MAX_LOGS_TO_STORE);
    }

    // שמירת הלוגים למאגר מקומי (לא בכל פעם כדי לשמור על ביצועים)
    if (this.logs.length % 10 === 0 || level === LogLevel.ERROR) {
      this.persistLogs();
    }

    // הצגת הלוג בקונסולה אם מופעל
    if (this.consoleOutput) {
      this.printToConsole(logEntry);
    }
  }

  /**
   * הצגת הלוג בקונסולה בפורמט מתאים
   * @param log - רשומת הלוג להצגה
   */
  private printToConsole(log: LogEntry): void {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const emoji = this.getLogEmoji(log.level);
    const prefix = `${emoji} ${timestamp} [${log.level}] [${log.module}]:`;

    switch (log.level) {
      case LogLevel.ERROR:
        console.error(`${prefix} ${log.message}`, log.data || '');
        if (log.stackTrace) {
          console.error('Stack:', log.stackTrace);
        }
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${log.message}`, log.data || '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${log.message}`, log.data || '');
        break;
      default:
        console.log(`${prefix} ${log.message}`, log.data || '');
    }
  }

  /**
   * בחירת אמוג'י מתאים לרמת הלוג
   * @param level - רמת הלוג
   */
  private getLogEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return '🔍';
      case LogLevel.INFO:
        return 'ℹ️';
      case LogLevel.WARN:
        return '⚠️';
      case LogLevel.ERROR:
        return '❌';
      default:
        return '📝';
    }
  }

  /**
   * שמירת הלוגים למאגר מקומי
   */
  private async persistLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (error) {
      // נמנע מרקורסיה על ידי אי דיווח על שגיאה בתוך פונקציית השמירה עצמה
      console.error('Failed to persist logs:', error);
    }
  }

  /**
   * יצירת לוג תקציר של כל התקשורת עם השרת
   * @param url - כתובת ה-API
   * @param method - סוג הבקשה
   * @param status - קוד סטטוס התגובה
   * @param duration - זמן התגובה במילישניות
   * @param requestData - נתוני בקשה
   * @param responseData - נתוני תשובה
   */
  public logApiCall(
    url: string,
    method: string,
    status: number,
    duration: number,
    requestData?: any,
    responseData?: any,
  ): void {
    const isError = status >= 400;
    const level = isError ? LogLevel.ERROR : LogLevel.INFO;
    const module = 'API';

    let message = `${method} ${this.getUrlPath(url)} - ${status} (${duration}ms)`;
    if (isError) {
      message = `שגיאת API: ${message}`;
    }

    const data = {
      url,
      method,
      status,
      duration,
      request: requestData,
      response: responseData,
    };

    this.log(level, module, message, data);
  }

  /**
   * חילוץ נתיב מתוך כתובת URL מלאה
   * @param url - כתובת URL מלאה
   */
  private getUrlPath(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch (e) {
      return url;
    }
  }
}

// יצוא מופע סינגלטון
export default LoggerService.getInstance();
