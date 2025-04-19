/**
 * קובץ המכיל הגדרות טיפוסים מרכזיים למודלים שבשימוש בכל האפליקציה
 */

/**
 * נתוני זמנים יומיים
 */
export interface ZmanItem {
  name: string;
  time: string;
  description?: string;
  parsedTime?: Date;
}

export interface ZmanimData {
  zmanim: ZmanItem[];
  date?: string;
  location?: string;
  updated_at?: string | number | Date;
}

/**
 * נתוני זמני תפילה
 */
export interface TfilaTime {
  id?: string;
  title: string;
  time?: string;
  description?: string;
}

/**
 * נתוני שיעורים
 */
export interface ShiorItem {
  id?: string;
  title: string;
  rav?: string;
  time?: string;
  day?: string | number;
  location?: string;
  description?: string;
}

/**
 * נתוני הנצחות
 */
export interface HanzachaItem {
  id?: string;
  name: string;
  description?: string;
  remarks?: string;
  date?: string;
}

/**
 * נתוני עולים לתורה
 */
export interface OleItem {
  id?: string;
  name: string;
  aliya: string;
  remarks?: string;
}

/**
 * נתוני הלכה יומית
 */
export interface HalachaData {
  texts?: string[];
  source?: string;
  timestamp?: string;
}

/**
 * מבנה נתוני DB מלא
 */
export interface DbData {
  zmanimData?: ZmanimData;
  tfilaTimeData?: TfilaTime[];
  shiorData?: ShiorItem[];
  hanzachotData?: HanzachaItem[];
  olimData?: OleItem[];
  [key: string]: any;
}

/**
 * מצב חיבור
 */
export interface ConnectionState {
  isOnline: boolean;
  lastOnline: Date | null;
  isStale: boolean;
}

/**
 * הגדרת טיפוס לתאריך עברי
 */
export interface HebrewDate {
  day: number;
  month: number;
  year: number;
  dayName?: string;
  monthName?: string;
  isLeapYear?: boolean;
}

/**
 * הגדרת טיפוס לאירוע/חג עברי
 */
export interface JewishEvent {
  name: string;
  date: Date;
  description?: string;
  render: (lang?: string) => string;
  type?: 'holiday' | 'memorial' | 'personal' | 'other';
}

/**
 * מצבי רענון
 */
export type RefreshType = 'auto' | 'manual' | 'initial' | 'background';

/**
 * תגובת API בסיסית
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  timestamp?: string | number;
}

/**
 * מצב המטמון
 */
export interface CachedDbState {
  dbData?: DbData;
  halachYomit?: HalachaData;
  loading: boolean;
  error: string | null;
  updatedAt: string | null;
  connectionStatus?: ConnectionState;
}

/**
 * הגדרות אפליקציה
 */
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  notifications: boolean;
  lastVisit: string | null;
  favoriteFeatures?: string[];
}
