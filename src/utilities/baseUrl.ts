// src/utilities/baseUrl.ts
import axios from 'axios';

const BASE_URL = 'https://btmanagement-production.up.railway.app';
// const BASE_URL1 = 'https://btmanagement1.herokuapp.com';
// const BASE_URL2 = 'https://btmanagement2.herokuapp.com';
// const BASE_URL_DEVELOPMENT = 'http://192.168.1.100:5000';

/**
 * מחזיר את ה-URL של שרת חי (Production).
 * אם לא נגיש, עדיין מחזיר את ה-URL הראשי.
 */
export const isAlive = async (): Promise<string> => {
  try {
    const result = await axios.get(`${BASE_URL}/api/zmanim`, {timeout: 3000});
    if (result.status === 200) {
      console.log('✅ live server is responsive');
      return BASE_URL;
    }
  } catch (err) {
    console.warn('⚠️ live server unreachable. Using fallback');
  }

  return BASE_URL;
};

/**
 * מחזיר true אם השרת הראשי זמין.
 */
export const isServerAlive = async (): Promise<boolean> => {
  try {
    const result = await axios.get(`${BASE_URL}/api/zmanim`, {timeout: 3000});
    return result.status === 200;
  } catch (err) {
    const error = err as Error;
    console.warn('⚠️ server check failed:', error.message);
    return false;
  }
};

/**
 * בניית URL מלא לנקודת קצה API
 * @param endpoint נקודת קצה API (למשל 'api/zmanim')
 * @returns URL מלא
 */
export const buildApiUrl = (endpoint: string): string => {
  // הסרת סלאש מתחילת נקודת הקצה אם קיים
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${BASE_URL}/${cleanEndpoint}`;
};

/**
 * מבנה אפשרויות בקשת API
 */
export interface ApiRequestOptions {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
}

/**
 * ביצוע בקשת GET לשרת
 * @param endpoint נקודת קצה API
 * @param options אפשרויות בקשה
 * @returns תוצאת הבקשה
 */
export const apiGet = async <T = any>(
  endpoint: string,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const url = buildApiUrl(endpoint);
  const {timeout = 5000, headers = {}, params = {}} = options;

  try {
    const response = await axios.get<T>(url, {
      timeout,
      headers,
      params,
    });
    return response.data;
  } catch (error) {
    console.error(`API GET error (${endpoint}):`, error);
    throw error;
  }
};

export default {
  BASE_URL,
  isAlive,
  isServerAlive,
  buildApiUrl,
  apiGet,
};
