// מודלים בסיסיים למערכת

import {ThemeMode} from '../utilities/ThemeManager';

/**
 * הגדרת טיפוס שגיאה מובנה
 */
export interface AppError {
  code: string;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
}

/**
 * הגדרת טיפוס מידע זמנים
 */
export interface ZmanimInfo {
  name: string;
  time: string;
  description?: string;
}

/**
 * הגדרת טיפוס להלכה יומית
 */
export interface HalachaYomit {
  text: string;
  source?: string;
  date?: string;
}
export interface HalachaYomit {
  text: string;
  title?: string;
  source?: string;
}
/**
 * העדפות משתמש הניתנות לשמירה
 */
export interface UserPreferences {
  /**
   * נושא העיצוב המועדף (בהיר/כהה/מערכת)
   */
  theme: ThemeMode;

  /**
   * גודל הגופן המועדף
   */
  fontSize: 'small' | 'medium' | 'large';

  /**
   * האם להציג התראות
   */
  notifications: boolean;

  /**
   * תאריך פתיחת האפליקציה האחרון
   */
  lastOpenedDate: string | null;
}

/**
 * מודל משתמש בסיסי
 */
export interface User {
  uid?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  preferences?: UserPreferences;
}

/**
 * מודל עבור נתוני אירוע/שיעור
 */
export interface Event {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  type: 'שיעור' | 'תפילה' | 'אירוע' | 'אחר';
  speaker?: string;
  imageURL?: string;
}

/**
 * מבנה הנתונים בתוך Redux Store
 */
export interface ReduxStore {
  cachedDb: {
    dbData: {
      zmanimData?: {
        zmanim: ZmanimInfo[];
        date?: string;
      };
      halachYomit?: string[];
      lastUpdated?: string;
    };
  };
  appSettings: UserPreferences;
}

/**
 * קובץ הגדרות טיפוסים מרכזי למערכת
 */

// ===== מודל נתוני תפילה =====
export interface PrayerTime {
  id: string;
  name: string; // שם התפילה (שחרית, מנחה, ערבית...)
  time: string; // זמן התפילה בתבנית HH:MM
  location?: string; // מיקום התפילה
  notes?: string; // הערות נוספות
}

export interface ShiurInfo {
  id: string;
  title: string; // כותרת השיעור
  rabbi: string; // שם הרב
  time: string; // זמן השיעור
  day: string; // יום בשבוע בעברית
  location: string; // מיקום השיעור
  notes?: string; // הערות נוספות
}

export interface Hanzacha {
  id: string;
  name: string; // שם הנפטר/ת
  date: string; // תאריך פטירה
  hebrewDate: string; // תאריך עברי
  family?: string; // משפחה
}

export interface OlehLaTorah {
  id: string;
  name: string; // שם העולה לתורה
  aliyah: string; // סוג העלייה (כהן, לוי, שלישי וכו')
  parasha?: string; // פרשת השבוע
  date?: string; // תאריך
}
// export interface OlehLaTorah {
//   name: string;
//   aliyah: string;
//   date: string;
//   notes?: string;
// }
// ===== מודל נתוני DB כללי =====
export interface DbData {
  prayerTimes: PrayerTime[];
  shiurim: ShiurInfo[];
  olimLaTorah: OlehLaTorah[];
  hanzachot: Hanzacha[];
  lastUpdated: string;
}

// ===== הגדרות לממשקי UI =====
export enum SectionStatus {
  LOADING = 'loading',
  ERROR = 'error',
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
}

export interface ConnectionStatus {
  isOnline: boolean;
  lastOnline: string | null;
  isStale: boolean;
}
