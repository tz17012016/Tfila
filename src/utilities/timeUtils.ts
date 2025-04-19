// ייבוא מתוקן שלא מסתמך על @hebcal/hdate באופן ישיר
// import * as HebcalCore from '@hebcal/core';
import {format, isValid, parse} from 'date-fns';
import {he} from 'date-fns/locale';

// השמת אובייקטים שימושיים למשתנים מקומיים ליתר נוחות
// const {HDate} = HebcalCore;

// ממשקים של טיפוסים
export interface HebrewDateInfo {
  day: number;
  month: string;
  year: number;
  monthId: number;
  formatted: string;
  isHoliday: boolean;
  holidays: string[];
  error?: string;
  date?: string;
}

export interface TimeItem {
  time: string;
  [key: string]: any;
}

export interface TimeItemWithDate extends TimeItem {
  dateObj: Date;
}

export const getTimeAgoString = (timestamp: string | number): string => {
  const now = Date.now();
  const diffMs = now - parseInt(timestamp.toString(), 10);

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'הרגע';
  if (diffMinutes < 60) return `לפני ${diffMinutes} דקות`;
  if (diffHours < 24) return `לפני ${diffHours} שעות`;
  return `לפני ${diffDays} ימים`;
};

/**
 * ממיר תאריך לתאריך עברי
 * @param date - תאריך לועזי (אם לא מועבר, משתמש בתאריך הנוכחי)
 * @returns - אובייקט עם מידע על התאריך העברי
 */
export function getHebrewDate(date = new Date()): HebrewDateInfo {
  try {
    const hdate = new Date(date);
    return {
      day: hdate.getDate(),
      month: hdate.toLocaleString('default', {month: 'long'}),
      year: hdate.getFullYear(),
      monthId: hdate.getMonth(),
      formatted: `${hdate.getDate()} ${hdate.toLocaleString('default', {
        month: 'long',
      })} ${hdate.getFullYear()}`,
      isHoliday: false,
      holidays: [],
    };
  } catch (error) {
    console.error('Error in getHebrewDate:', error);
    return {
      day: 0,
      month: '',
      year: 0,
      monthId: 0,
      formatted: '',
      isHoliday: false,
      holidays: [],
      error: 'Failed to parse Hebrew date',
      date: format(date, 'yyyy-MM-dd'),
    };
  }
}

/**
 * פונקציה שממירה שעה בפורמט HH:MM לאובייקט Date
 * @param timeString - שעה בפורמט "HH:MM"
 * @param baseDate - תאריך הבסיס (ברירת מחדל: היום)
 * @returns - אובייקט Date או null אם הפרסור נכשל
 */
export function parseTimeString(
  timeString: string | null | undefined,
  baseDate = new Date(),
): Date | null {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }

  try {
    // יוצרים תבנית של תאריך + שעה
    const dateStr = format(baseDate, 'yyyy-MM-dd');

    // מנקים את מחרוזת הזמן (למקרה שיש תווים מיוחדים)
    const cleanTime = timeString.trim().replace(/[^\d:]/g, '');

    // תאריך בפורמט ISO
    const dateTimeStr = `${dateStr}T${cleanTime}`;
    const parsedDate = new Date(dateTimeStr);

    if (isValid(parsedDate)) {
      return parsedDate;
    }

    // אם הפרסור הרגיל נכשל, ננסה שיטה אחרת
    const [hours, minutes] = cleanTime.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes)) {
      const date = new Date(baseDate);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }

    return null;
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
}

/**
 * פורמט שעה לתצוגה בעברית
 * @param time - אובייקט Date או מחרוזת זמן
 * @param withSeconds - האם להציג שניות (ברירת מחדל: false)
 * @returns - שעה מפורמטת לתצוגה
 */
export function formatTimeForDisplay(
  time: Date | string | null | undefined,
  withSeconds = false,
): string {
  if (!time) return '';

  try {
    const timeDate = typeof time === 'string' ? parseTimeString(time) : time;

    if (!timeDate || !isValid(timeDate)) {
      return typeof time === 'string' ? time : '';
    }

    const formatStr = withSeconds ? 'HH:mm:ss' : 'HH:mm';
    return format(timeDate, formatStr);
  } catch (error) {
    console.error('Error formatting time for display:', error);
    return typeof time === 'string' ? time : '';
  }
}

/**
 * בדיקה האם השעה הנוכחית בטווח של שעות מסוימות
 * @param startTime - שעת התחלה בפורמט "HH:MM"
 * @param endTime - שעת סיום בפורמט "HH:MM"
 * @param currentTime - השעה הנוכחית (ברירת מחדל: השעה עכשיו)
 * @returns - האם השעה הנוכחית בטווח
 */
export function isTimeInRange(
  startTime: string,
  endTime: string,
  currentTime = new Date(),
): boolean {
  if (!startTime || !endTime) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = parseTimeString(startTime, today);
  const end = parseTimeString(endTime, today);
  const current = new Date(currentTime);

  // הסרת התאריך מהשעה הנוכחית והשארת רק השעה
  current.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());

  if (!start || !end) {
    return false;
  }

  return current >= start && current <= end;
}

/**
 * פונקציה שמקבלת מערך זמנים ומחזירה את הזמן הקרוב ביותר לשעה הנוכחית
 * @param timeArray - מערך אובייקטים שמכילים שדה time
 * @param currentTime - השעה הנוכחית (ברירת מחדל: השעה עכשיו)
 * @returns - האובייקט הקרוב ביותר או null אם המערך ריק
 */
export function getClosestTime(
  timeArray: TimeItem[] | null | undefined,
  currentTime = new Date(),
): TimeItem | null {
  if (!timeArray || !Array.isArray(timeArray) || timeArray.length === 0) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ממירים את השעות לאובייקטי Date
  const timesWithDates = timeArray
    .filter(item => item && item.time)
    .map(item => ({
      ...item,
      dateObj: parseTimeString(item.time, today),
    }))
    .filter((item): item is TimeItemWithDate => item.dateObj !== null);

  if (timesWithDates.length === 0) {
    return null;
  }

  // מחשבים את ההפרש בין השעה הנוכחית לכל שעה
  const now = new Date(currentTime);
  now.setFullYear(today.getFullYear(), today.getMonth(), today.getDate());

  let closestItem = timesWithDates[0];
  let minDifference = Math.abs(now.getTime() - closestItem.dateObj.getTime());

  for (let i = 1; i < timesWithDates.length; i++) {
    const difference = Math.abs(now.getTime() - timesWithDates[i].dateObj.getTime());
    if (difference < minDifference) {
      minDifference = difference;
      closestItem = timesWithDates[i];
    }
  }

  return closestItem;
}

/**
 * המרת מחרוזת תאריך לפורמט עברי ידידותי
 * @param dateString - מחרוזת תאריך (YYYY-MM-DD)
 * @returns - תאריך מפורמט בעברית
 */
export function formatHebrewFriendlyDate(dateString: string | Date | null | undefined): string {
  try {
    if (!dateString) return '';

    const date =
      typeof dateString === 'string'
        ? parse(dateString, 'yyyy-MM-dd', new Date())
        : new Date(dateString);

    if (!isValid(date)) {
      return typeof dateString === 'string' ? dateString : '';
    }

    return format(date, 'd בMMMM yyyy', {locale: he});
  } catch (error) {
    console.error('Error formatting Hebrew date:', error);
    return typeof dateString === 'string' ? dateString : '';
  }
}

export default {
  getHebrewDate,
  parseTimeString,
  formatTimeForDisplay,
  isTimeInRange,
  getClosestTime,
  formatHebrewFriendlyDate,
};
