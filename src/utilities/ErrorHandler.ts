import AsyncStorage from '@react-native-async-storage/async-storage';
import {AppError} from '../models';

const ERROR_LOG_KEY = '@tfila_error_log';
const MAX_ERROR_LOGS = 50;

/**
 * מנהל שגיאות מרכזי של האפליקציה
 * אחראי על רישום, דיווח וטיפול בשגיאות באופן אחיד
 */
class ErrorHandler {
  /**
   * יצירת אובייקט שגיאה מפורט
   * @param code - קוד שגיאה
   * @param message - הודעת שגיאה
   * @param context - הקשר נוסף או מידע על השגיאה
   * @returns אובייקט שגיאה מפורט
   */
  static createError(code: string, message: string, context?: Record<string, any>): AppError {
    return {
      code,
      message,
      timestamp: new Date().toISOString(),
      context,
    };
  }

  /**
   * טיפול בשגיאה - רישום וטיפול אחיד בשגיאות
   * @param error - שגיאת JavaScript או אובייקט שגיאה מותאם
   * @param source - מקור השגיאה (שם הקומפוננטה/מודול)
   * @param critical - האם זו שגיאה קריטית
   * @returns אובייקט שגיאה מפורט
   */
  static handleError(error: unknown, source: string, critical = false): AppError {
    // יצירת אובייקט שגיאה מפורט מכל סוג של שגיאה
    let appError: AppError;

    if (typeof error === 'string') {
      appError = this.createError('ERROR', error, {source});
    } else if (error instanceof Error) {
      // Safe extraction of stack to prevent "Error.stack getter called with an invalid receiver"
      let stack: string | undefined;
      try {
        stack = error.stack;
      } catch (e) {
        stack = '[Stack trace unavailable]';
      }

      appError = this.createError('JS_ERROR', error.message, {
        source,
        stack,
        name: error.name,
      });
    } else if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      // התייחסות לשגיאות API או שגיאות מותאמות אחרות
      appError = this.createError(String((error as any).code), String((error as any).message), {
        source,
        ...((error as any).context || {}),
      });
    } else {
      // שגיאה לא ידועה
      let rawError: string;
      try {
        rawError = JSON.stringify(error);
      } catch (e) {
        rawError = '[Unstringifiable error]';
      }

      appError = this.createError('UNKNOWN_ERROR', 'שגיאה לא מזוהה', {
        source,
        rawError,
      });
    }

    // רישום השגיאה
    console.error(`[${appError.code}] ${source}: ${appError.message}`);

    // שמירת השגיאה למאגר מקומי
    this.logErrorToStorage(appError);

    // טיפול בשגיאות קריטיות
    if (critical) {
      // בעתיד ניתן להוסיף כאן שליחה לשרת חיצוני
      // או התאוששות לשגיאות קריטיות
    }

    return appError;
  }

  /**
   * שמירת שגיאה למאגר מקומי
   * @param error - אובייקט השגיאה
   */
  private static async logErrorToStorage(error: AppError): Promise<void> {
    try {
      // קבלת היסטוריית שגיאות קיימת
      const existingLogsString = await AsyncStorage.getItem(ERROR_LOG_KEY);
      const logs: AppError[] = existingLogsString ? JSON.parse(existingLogsString) : [];

      // הוספת השגיאה החדשה בתחילת המערך
      logs.unshift(error);

      // שמירה על מספר מוגבל של שגיאות
      if (logs.length > MAX_ERROR_LOGS) {
        logs.length = MAX_ERROR_LOGS;
      }

      // שמירה במאגר המקומי
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(logs));
    } catch (storageError) {
      console.error('Failed to save error log:', storageError);
    }
  }

  /**
   * קבלת היסטוריית השגיאות
   * @returns מערך של שגיאות מהמאגר המקומי
   */
  static async getErrorLogs(): Promise<AppError[]> {
    try {
      const logs = await AsyncStorage.getItem(ERROR_LOG_KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to retrieve error logs:', error);
      return [];
    }
  }

  /**
   * ניקוי היסטוריית השגיאות
   */
  static async clearErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ERROR_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  /**
   * בדיקה האם מדובר בשגיאת רשת
   * @param error - שגיאה כלשהי
   * @returns האם זו שגיאת רשת
   */
  static isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('internet') ||
        message.includes('offline')
      );
    }

    return false;
  }
}

export default ErrorHandler;
