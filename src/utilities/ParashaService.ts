import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
const HEBCAL_API_URL = 'https://www.hebcal.com/hebcal';
const PARASHA_CACHE_KEY = '@parasha_data';
const PARASHA_CACHE_DATE_KEY = '@parasha_cache_date';
const CACHE_EXPIRY_DAYS = 1; // Cache expires after 1 day

// Interface for Parasha data
export interface ParashaData {
  parashaName: string; // Weekly Torah portion name
  haftarahName: string; // Haftarah name
  date: string; // Date of the parasha
  hebrew: {
    parashaName: string; // Hebrew name of Torah portion
    haftarahName: string; // Hebrew name of Haftarah
  };
}

/**
 * מתרגם את שמות ספרי התנ"ך מאנגלית לעברית
 * @param englishBookName - שם הספר באנגלית
 * @returns שם הספר בעברית
 */
function translateBookName(englishBookName: string): string {
  const bookTranslations: Record<string, string> = {
    Genesis: 'בראשית',
    Exodus: 'שמות',
    Leviticus: 'ויקרא',
    Numbers: 'במדבר',
    Deuteronomy: 'דברים',
    Joshua: 'יהושע',
    Judges: 'שופטים',
    'I Samuel': 'שמואל א',
    'II Samuel': 'שמואל ב',
    '1 Samuel': 'שמואל א',
    '2 Samuel': 'שמואל ב',
    'I Kings': 'מלכים א',
    'II Kings': 'מלכים ב',
    '1 Kings': 'מלכים א',
    '2 Kings': 'מלכים ב',
    Isaiah: 'ישעיהו',
    Jeremiah: 'ירמיהו',
    Ezekiel: 'יחזקאל',
    Hosea: 'הושע',
    Joel: 'יואל',
    Amos: 'עמוס',
    Obadiah: 'עובדיה',
    Jonah: 'יונה',
    Micah: 'מיכה',
    Nahum: 'נחום',
    Habakkuk: 'חבקוק',
    Zephaniah: 'צפניה',
    Haggai: 'חגי',
    Zechariah: 'זכריה',
    Malachi: 'מלאכי',
    Psalms: 'תהלים',
    Proverbs: 'משלי',
    Job: 'איוב',
    'Song of Songs': 'שיר השירים',
    Ruth: 'רות',
    Lamentations: 'איכה',
    Ecclesiastes: 'קהלת',
    Esther: 'אסתר',
    Daniel: 'דניאל',
    Ezra: 'עזרא',
    Nehemiah: 'נחמיה',
    'I Chronicles': 'דברי הימים א',
    'II Chronicles': 'דברי הימים ב',
    '1 Chronicles': 'דברי הימים א',
    '2 Chronicles': 'דברי הימים ב',
    // הוספת תבניות קיצור נוספות
    Sam: 'שמואל',
    Kgs: 'מלכים',
    Chron: 'דברי הימים',
    Deut: 'דברים',
    Lev: 'ויקרא',
    Num: 'במדבר',
    Gen: 'בראשית',
    Exod: 'שמות',
  };

  // בדיקה למקרים של קיצורים (למשל "I Sam" או "1 Sam")
  for (const [eng, heb] of Object.entries(bookTranslations)) {
    if (englishBookName.includes(eng)) {
      return heb;
    }
  }

  return bookTranslations[englishBookName] || englishBookName;
}

/**
 * ממיר מספרים לאותיות עבריות (גימטריה)
 * @param number - המספר להמרה
 * @returns מחרוזת של אותיות עבריות המייצגות את המספר
 */
function numberToHebrewLetters(number: number): string {
  if (number <= 0) {
    return '';
  }

  const letters = [
    '',
    'א',
    'ב',
    'ג',
    'ד',
    'ה',
    'ו',
    'ז',
    'ח',
    'ט',
    'י',
    'יא',
    'יב',
    'יג',
    'יד',
    'טו',
    'טז',
    'יז',
    'יח',
    'יט',
    'כ',
    'כא',
    'כב',
    'כג',
    'כד',
    'כה',
    'כו',
    'כז',
    'כח',
    'כט',
    'ל',
    'לא',
    'לב',
    'לג',
    'לד',
    'לה',
    'לו',
    'לז',
    'לח',
    'לט',
    'מ',
    'מא',
    'מב',
    'מג',
    'מד',
    'מה',
    'מו',
    'מז',
    'מח',
    'מט',
    'נ',
  ];

  if (number <= 50) {
    return letters[number];
  }

  // המספרים הגדולים יותר דורשים המרה מורכבת יותר
  let result = '';

  // מאות
  const hundreds = Math.floor(number / 100);
  if (hundreds > 0) {
    const hebrewHundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
    result += hebrewHundreds[hundreds];
    number %= 100;
  }

  // עשרות ויחידות
  if (number > 0) {
    if (result !== '') {
      result += "'"; // גרש מפריד
    }
    result += letters[number];
  }

  return result;
}

/**
 * מתרגם מחרוזת של הפטרה באנגלית לעברית
 * דוגמה: "Isaiah 6:1-7:6" -> "ישעיהו ו:א-ז:ו"
 * @param englishHaftarah - מחרוזת הפטרה באנגלית
 * @returns מחרוזת הפטרה בעברית
 */
function translateHaftarah(englishHaftarah: string): string {
  if (!englishHaftarah) {
    return '';
  }

  // ניקוי סימני פיסוק מיותרים
  const cleanText = englishHaftarah.replace(/\s*\([^)]*\)\s*/g, ' ').trim();

  // תבניות שונות של הפטרות
  const patterns = [
    // Isaiah 6:1-7:6
    /^([\w\s]+)\s+(\d+):(\d+)(?:-(\d+):(\d+)|(?:-|-\s+)(\d+))?$/,
    // Isaiah 6:1 - 7:6
    /^([\w\s]+)\s+(\d+):(\d+)\s*-\s*(\d+):(\d+)$/,
    // Isaiah 6:1, 3-9
    /^([\w\s]+)\s+(\d+):(\d+)(?:,\s*(?:and\s+)?(\d+)-(\d+))?$/,
  ];

  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const bookName = translateBookName(match[1]);
      const startChapter = parseInt(match[2], 10);
      const startVerse = parseInt(match[3], 10);

      let hebrewHaftarah = `${bookName} ${numberToHebrewLetters(
        startChapter,
      )}:${numberToHebrewLetters(startVerse)}`;

      if (match[4] && match[5]) {
        // טווח פרקים ופסוקים: "Isaiah 6:1-7:6"
        const endChapter = parseInt(match[4], 10);
        const endVerse = parseInt(match[5], 10);
        hebrewHaftarah += `-${numberToHebrewLetters(endChapter)}:${numberToHebrewLetters(
          endVerse,
        )}`;
      } else if (match[6]) {
        // טווח פסוקים באותו פרק: "Isaiah 6:1-9"
        const endVerse = parseInt(match[6], 10);
        hebrewHaftarah += `-${numberToHebrewLetters(endVerse)}`;
      }

      return hebrewHaftarah;
    }
  }

  // אם לא התאים לאף אחת מהתבניות, נסה לחלץ לפחות את שם הספר
  for (const [eng, heb] of Object.entries(translateBookName)) {
    if (typeof eng === 'string' && cleanText.includes(eng)) {
      return cleanText.replace(eng, heb);
    }
  }

  // אם לא הצלחנו לתרגם בכלל, החזר את המקור
  return englishHaftarah;
}

/**
 * בודק האם מחרוזת היא בעברית
 * @param text - המחרוזת לבדיקה
 * @returns האם המחרוזת בעברית
 */
function isHebrewText(text: string): boolean {
  // בדיקה אם המחרוזת מכילה אותיות עבריות
  return /[\u0590-\u05FF]/.test(text);
}

/**
 * Service for fetching weekly Torah portion and Haftarah information
 */
export class ParashaService {
  /**
   * Fetch the weekly Torah portion and Haftarah information
   * @param forceRefresh - Force refresh from API ignoring cache
   * @returns Promise with Parasha data
   */
  async getParashaData(forceRefresh = false): Promise<ParashaData | null> {
    try {
      // Check cache first unless forced refresh
      if (!forceRefresh) {
        const cachedData = await this.getCachedData();
        if (cachedData) {
          console.log('Using cached Parasha data');

          // וודא שגם המידע מהמטמון יעבור תרגום במידה וצריך
          const verifiedData = this.ensureHebrewTranslation(cachedData);
          return verifiedData;
        }
      }

      // Fetch from API
      const url = this.buildApiUrl();
      console.log(`Fetching Parasha data from: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Hebcal API error: ${response.status}`);
      }

      const data = await response.json();

      // Find the Parasha (weekly Torah reading) event
      const parashaEvent = data.items?.find((event: any) => event.category === 'parashat');

      // If no parasha event found, return null
      if (!parashaEvent) {
        console.warn('No Parasha data found in the response');
        return null;
      }

      // Extract Haftarah information (usually part of the same event)
      let haftarahName = '';
      let haftarahNameHebrew = '';

      // Haftarah is typically included in the Parasha event's memo field
      if (parashaEvent.memo && typeof parashaEvent.memo === 'string') {
        const haftarahMatch = parashaEvent.memo.match(/הפטרה: (.+?)(?:$|\.)/);
        if (haftarahMatch && haftarahMatch[1]) {
          haftarahNameHebrew = haftarahMatch[1].trim();
          haftarahName = parashaEvent.leyning?.haftarah || '';
        }
      }

      // If no haftarah was found in memo, try to use direct leyning data if available
      if ((!haftarahNameHebrew || haftarahNameHebrew === '') && parashaEvent.leyning?.haftarah) {
        haftarahName = parashaEvent.leyning.haftarah;
        // לתרגם את ההפטרה לעברית (למשל "Ezekiel 37:15-28" ל"יחזקאל לז:טו-כח")
        haftarahNameHebrew = translateHaftarah(haftarahName);
      }

      // תיקון למקרה שההפטרה בעברית לא זוהתה נכון
      if (!isHebrewText(haftarahNameHebrew) && haftarahName) {
        haftarahNameHebrew = translateHaftarah(haftarahName);
      }

      // הבטחה שיש לנו שם פרשה בעברית
      let parashaNameHebrew = parashaEvent.hebrew || '';
      if (!parashaNameHebrew || !isHebrewText(parashaNameHebrew)) {
        parashaNameHebrew = parashaEvent.title || '';
      }

      // Create the parasha data object
      const parashaData: ParashaData = {
        parashaName: parashaEvent.title || '',
        haftarahName,
        date: parashaEvent.date || new Date().toISOString(),
        hebrew: {
          parashaName: parashaNameHebrew,
          haftarahName: haftarahNameHebrew,
        },
      };

      // אימות סופי שהכל מתורגם לעברית
      const verifiedData = this.ensureHebrewTranslation(parashaData);

      // Cache the data
      await this.cacheData(verifiedData);

      return verifiedData;
    } catch (error) {
      console.error('Error fetching Parasha data:', error);
      // Try to return cached data even if expired as fallback
      const cachedData = await this.getCachedData(true);
      if (cachedData) {
        return this.ensureHebrewTranslation(cachedData);
      }
      return null;
    }
  }

  /**
   * וידוא שכל הנתונים מתורגמים לעברית
   * @param data - אובייקט הנתונים
   * @returns אובייקט הנתונים המתוקן
   */
  private ensureHebrewTranslation(data: ParashaData): ParashaData {
    // העתק של האובייקט המקורי
    const result = {...data};

    // וידוא שיש שם פרשה בעברית
    if (!result.hebrew.parashaName || !isHebrewText(result.hebrew.parashaName)) {
      if (result.parashaName) {
        // נסה לתרגם מהשם באנגלית
        const translatedName = translateBookName(result.parashaName);
        if (isHebrewText(translatedName)) {
          result.hebrew.parashaName = translatedName;
        } else {
          // שימוש בשם המקורי אם לא ניתן לתרגם
          result.hebrew.parashaName = result.parashaName;
        }
      }
    }

    // וידוא שיש שם הפטרה בעברית
    if (!result.hebrew.haftarahName || !isHebrewText(result.hebrew.haftarahName)) {
      if (result.haftarahName) {
        // תרגום ההפטרה לעברית
        result.hebrew.haftarahName = translateHaftarah(result.haftarahName);
      }
    }

    return result;
  }

  /**
   * Clear the cached data
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PARASHA_CACHE_KEY);
      await AsyncStorage.removeItem(PARASHA_CACHE_DATE_KEY);
      console.log('Parasha cache cleared');
    } catch (error) {
      console.error('Failed to clear Parasha cache:', error);
    }
  }

  /**
   * Build the API URL with all required parameters
   * @returns Fully formed API URL
   */
  private buildApiUrl(): string {
    const params = new URLSearchParams({
      v: '1',
      cfg: 'json',
      maj: 'on', // Include major holidays
      min: 'on', // Include minor holidays
      mod: 'on', // Include modern holidays
      nx: 'on', // Include Rosh Chodesh
      year: 'now', // Current year
      month: 'x', // All months
      ss: 'on', // Include Shabbat start times
      mf: 'on', // Include festival candle lighting
      c: 'on', // Include candle lighting times
      geo: 'geoname', // Use geoname for location
      geonameid: '293690', // Rosh Ha'Ayin, Israel
      M: 'on', // Include Parashat HaShavua
      s: 'on', // Use Israel sedra scheme
      i: 'on', // Include Israeli holidays
      lg: 'he', // Use Hebrew language
    });

    return `${HEBCAL_API_URL}?${params.toString()}`;
  }

  /**
   * Cache the Parasha data
   * @param data - Data to cache
   */
  private async cacheData(data: ParashaData): Promise<void> {
    try {
      await AsyncStorage.setItem(PARASHA_CACHE_KEY, JSON.stringify(data));
      await AsyncStorage.setItem(PARASHA_CACHE_DATE_KEY, new Date().toISOString());
      console.log('Parasha data cached successfully');
    } catch (error) {
      console.error('Failed to cache Parasha data:', error);
    }
  }

  /**
   * Check if cache is valid and retrieve cached data
   * @param ignoreExpiry - Ignore cache expiration (for fallbacks)
   * @returns Cached data or null if expired/not available
   */
  private async getCachedData(ignoreExpiry = false): Promise<ParashaData | null> {
    try {
      // Check if cache exists
      const cachedDataStr = await AsyncStorage.getItem(PARASHA_CACHE_KEY);
      const cacheDateStr = await AsyncStorage.getItem(PARASHA_CACHE_DATE_KEY);

      if (!cachedDataStr || !cacheDateStr) {
        return null;
      }

      // Check if cache is expired
      if (!ignoreExpiry) {
        const cacheDate = new Date(cacheDateStr);
        const now = new Date();
        const diffMs = now.getTime() - cacheDate.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);

        if (diffDays > CACHE_EXPIRY_DAYS) {
          console.log('Parasha cache expired');
          return null;
        }
      }

      return JSON.parse(cachedDataStr);
    } catch (error) {
      console.error('Error retrieving Parasha cached data:', error);
      return null;
    }
  }
}

// Export default instance
export default new ParashaService();
