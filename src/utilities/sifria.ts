import axios from 'axios';

interface CalendarItem {
  title?: {
    en: string;
    he?: string;
  };
  url?: string;
  displayValue?: {
    en: string;
    he: string;
  };
  date?: string;
  order?: number;
}

interface CalendarResponse {
  calendar_items?: CalendarItem[];
  date?: string;
  timezone?: string;
}

interface VersionData {
  language: string;
  versionTitle: string;
  text: string[][];
}

interface TextResponse {
  versions?: VersionData[];
  text?: string[];
  he?: string[];
  ref?: string;
  book?: string;
}

/**
 * פונקציה להשגת הלכה יומית מאתר ספריא
 * @returns מערך עם קטעי הלכה יומית
 */
export const getHalchYomit = async (): Promise<string[]> => {
  // ניקוי תגיות HTML
  const clean = (segment: string | null | undefined): string => {
    if (!segment) {
      return '';
    }
    return segment.replace(/<[^>]*>/g, '').trim();
  };

  // חילוץ טקסטים עבריים ממבנה דו־ממדי
  const extractTextArray = (data: TextResponse): string[] => {
    const version = data.versions?.find(v => v.language === 'he');
    if (!version || !Array.isArray(version.text)) {
      return [];
    }
    return version.text
      .flat(Infinity)
      .filter((t): t is string => typeof t === 'string' && t.trim() !== '');
  };

  try {
    // שלב 1: שליפת הלכה יומית מתוך לוח השנה
    const calendarRes = await axios.get<CalendarResponse>(
      'https://www.sefaria.org.il/api/calendars?timezone=Asia/Tel_Aviv',
    );
    const calendar_items = calendarRes.data?.calendar_items || [];

    const halachaItem = calendar_items.find(item => item.title?.en === 'Halakhah Yomit');
    const tref = halachaItem?.url;

    if (!tref) {
      console.warn('❌ לא נמצאה הלכה יומית');
      return [];
    }

    // console.log('📘 Using tref:', tref);

    // שלב 2: ניסיון ראשון לקרוא את הטקסט
    let textRes = await axios.get<TextResponse>(
      `https://www.sefaria.org.il/api/v3/texts/${encodeURIComponent(tref)}?lang=he`,
    );
    let textArray = extractTextArray(textRes.data);

    // fallback אם אין טקסט
    if (!textArray.length) {
      const fallbackRef = 'Shulchan_Arukh,_Orach_Chayim.1-3';
      console.warn('⚠️ Falling back to:', fallbackRef);
      const fallbackRes = await axios.get<TextResponse>(
        `https://www.sefaria.org.il/api/v3/texts/${encodeURIComponent(fallbackRef)}?lang=he`,
      );
      textArray = extractTextArray(fallbackRes.data);
    }

    return textArray.slice(0, 3).map(clean);
  } catch (error) {
    console.error('📛 שגיאה בשליפת ההלכה:', error instanceof Error ? error.message : String(error));
    return [];
  }
};

/**
 * פונקציה לחיפוש טקסט בספריא
 * @param query מחרוזת חיפוש
 * @returns תוצאות חיפוש
 */
export const searchSefaria = async (query: string): Promise<any[]> => {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    const response = await axios.get(
      `https://www.sefaria.org.il/api/search-wrapper?query=${encodeURIComponent(
        query,
      )}&type=text&language=he`,
    );

    return response.data?.hits?.hits || [];
  } catch (error) {
    console.error('שגיאה בחיפוש בספריא:', error instanceof Error ? error.message : String(error));
    return [];
  }
};

/**
 * פונקציה לקבלת פרשת השבוע הנוכחית
 * @returns מידע על פרשת השבוע
 */
export const getCurrentParasha = async (): Promise<{
  name?: string;
  ref?: string;
  he?: string;
  en?: string;
} | null> => {
  try {
    const response = await axios.get<CalendarResponse>(
      'https://www.sefaria.org.il/api/calendars?timezone=Asia/Tel_Aviv',
    );

    const parashaItem = response.data?.calendar_items?.find(
      item => item.title?.en === 'Parashat Hashavua',
    );

    if (!parashaItem) {
      return null;
    }

    return {
      name: parashaItem.displayValue?.he || '',
      ref: parashaItem.url,
      he: parashaItem.displayValue?.he || '',
      en: parashaItem.displayValue?.en || '',
    };
  } catch (error) {
    console.error(
      'שגיאה בקבלת פרשת השבוע:',
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }
};

export default {
  getHalchYomit,
  searchSefaria,
  getCurrentParasha,
};
