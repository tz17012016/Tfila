// import {Event, HDate, HebrewCalendar, Location, Zmanim} from '@hebcal/core';

// /**
//  * אפשרויות תצורה לשירות Hebcal
//  */
// export interface HebcalServiceOptions {
//   /** שם העיר לחישוב המיקום (ברירת מחדל: 'Jerusalem') */
//   city?: string;
//   /** מזהה אזור הזמן לפי IANA (ברירת מחדל: 'Asia/Jerusalem') */
//   tzid?: string;
//   /** האם להתחשב בגובה בחישוב הזמנים (ברירת מחדל: false) */
//   useElevation?: boolean;
// }

// /**
//  * מבנה נתוני זמנים (Zmanim) יומיים
//  */
// export interface DailyZmanim {
//   alotHashachar: Date | null; // Allow null for robustness
//   seaLevelSunrise: Date | null;
//   dawn: Date | null;
//   sunrise: Date | null;
//   seaLevelSunset: Date | null;
//   dusk: Date | null;
//   sunset: Date | null;
//   astronomicalSunrise: Date | null;
//   astronomicalSunset: Date | null;
//   chatzot: Date | null;
//   minchaGedola: Date | null;
//   minchaKetana: Date | null;
//   misheyakir: Date | null;
//   plagHaMincha: Date | null;
//   sofZmanShmaGra: Date | null;
//   sofZmanShmaMagen: Date | null;
//   sofZmanTfilaGra: Date | null;
//   sofZmanTfilaMagen: Date | null;
//   tzeit: Date | null;
// }

// /**
//  * שירות לחישוב תאריך עברי, אירועי לוח שנה וזמני היום
//  * מבוסס על ספריית @hebcal/core
//  */
// export class HebcalService {
//   private city: string;
//   private loc: Location;
//   private tzid: string;
//   private useElevation: boolean;

//   /**
//    * אתחול השירות עם אפשרויות תצורה.
//    * @param options – פרטי עיר, אזור זמן ושימוש בגובה
//    */
//   constructor({
//     city = 'Jerusalem',
//     tzid = 'Asia/Jerusalem',
//     useElevation = false,
//   }: HebcalServiceOptions = {}) {
//     this.city = city;
//     // Use a safer lookup with fallback
//     try {
//       const lookup = Location.lookup(city);
//       if (!lookup) {
//         console.warn(`Invalid city '${city}', defaulting to Jerusalem`);
//         this.loc = Location.lookup('Jerusalem')!;
//       } else {
//         this.loc = lookup;
//       }
//     } catch (error) {
//       console.error(`Error looking up location for ${city}, defaulting to Jerusalem:`, error);
//       this.loc = Location.lookup('Jerusalem')!;
//     }
//     this.tzid = this.loc.tzid || tzid; // Prefer tzid from looked up location
//     this.useElevation = useElevation;
//   }

//   /**
//    * המרת תאריך לועזי לתאריך עברי
//    */
//   getHebrewDate(date: Date = new Date()): HDate {
//     return new HDate(date);
//   }

//   /**
//    * פרטי שיטת חישוב הזמנים
//    */
//   getMethod(): {algorithm: string; useElevation: boolean} {
//     return {algorithm: 'NOAA', useElevation: this.useElevation};
//   }

//   /**
//    * יוצרת מופע Zmanim לימי הזמנים ההלכתיים
//    */
//   getZmanim(date: Date = new Date()): Zmanim {
//     // Ensure location has valid coordinates before creating Zmanim
//     if (
//       !this.loc ||
//       typeof this.loc.getLatitude() !== 'number' ||
//       typeof this.loc.getLongitude() !== 'number'
//     ) {
//       console.error('Cannot calculate Zmanim: Invalid location data.', this.loc);
//       // Return a dummy or throw an error, depending on desired handling
//       // For now, let's throw to make the issue clear
//       throw new Error('Invalid location data for Zmanim calculation.');
//     }
//     return new Zmanim(this.loc, this.getHebrewDate(date), this.useElevation);
//   }

//   /**
//    * חישוב כל זמני היום עבור תאריך נתון
//    */
//   getDailyZmanim(date: Date = new Date()): DailyZmanim {
//     try {
//       const z = this.getZmanim(date);
//       // Helper to safely call Zmanim methods that might return null/undefined/NaN
//       const safeGetTime = (method: () => Date | number | null | undefined): Date | null => {
//         try {
//           const result = method();
//           if (result instanceof Date && !isNaN(result.getTime())) {
//             return result;
//           }
//           // Handle cases where @hebcal/core might return NaN or other non-Date values
//           if (typeof result === 'number' && !isNaN(result)) {
//             // Attempt to convert timestamp number to Date
//             const dt = new Date(result);
//             if (!isNaN(dt.getTime())) return dt;
//           }
//           return null;
//         } catch (err) {
//           // Log specific method error if needed
//           // console.error(`Error in Zmanim method:`, err);
//           return null;
//         }
//       };

//       return {
//         alotHashachar: safeGetTime(() => z.alotHaShachar()),
//         seaLevelSunrise: safeGetTime(() => z.seaLevelSunrise()),
//         dawn: safeGetTime(() => z.dawn()),
//         sunrise: safeGetTime(() => z.sunrise()),
//         seaLevelSunset: safeGetTime(() => z.seaLevelSunset()),
//         dusk: safeGetTime(() => z.dusk()),
//         sunset: safeGetTime(() => z.sunset()),
//         astronomicalSunrise: safeGetTime(() => z.astronomicalSunrise()),
//         astronomicalSunset: safeGetTime(() => z.astronomicalSunset()),
//         chatzot: safeGetTime(() => z.chatzot()),
//         minchaGedola: safeGetTime(() => z.minchaGedola()),
//         minchaKetana: safeGetTime(() => z.minchaKetana()),
//         misheyakir: safeGetTime(() => z.misheyakir()),
//         plagHaMincha: safeGetTime(() => z.plagHaMincha()),
//         sofZmanShmaGra: safeGetTime(() => z.sofZmanShma()),
//         sofZmanShmaMagen: safeGetTime(() => z.sofZmanShmaMGA()),
//         sofZmanTfilaGra: safeGetTime(() => z.sofZmanTfilla()),
//         sofZmanTfilaMagen: safeGetTime(() => z.sofZmanTfillaMGA()),
//         tzeit: safeGetTime(() => z.tzeit()),
//       };
//     } catch (error) {
//       console.error(`Error calculating daily zmanim for ${date}:`, error);
//       // Return an object with all null values in case of error during Zmanim instantiation
//       return {
//         alotHashachar: null,
//         seaLevelSunrise: null,
//         dawn: null,
//         sunrise: null,
//         seaLevelSunset: null,
//         dusk: null,
//         sunset: null,
//         astronomicalSunrise: null,
//         astronomicalSunset: null,
//         chatzot: null,
//         minchaGedola: null,
//         minchaKetana: null,
//         misheyakir: null,
//         plagHaMincha: null,
//         sofZmanShmaGra: null,
//         sofZmanShmaMagen: null,
//         sofZmanTfilaGra: null,
//         sofZmanTfilaMagen: null,
//         tzeit: null,
//       };
//     }
//   }

//   /**
//    * alias לתמיכה בשם getStandardZmanim
//    */
//   getStandardZmanim(date: Date = new Date()): DailyZmanim {
//     return this.getDailyZmanim(date);
//   }

//   /**
//    * הפקת אירועי לוח שנה עבור תאריך נתון
//    */
//   getEvents(
//     date: Date = new Date(),
//     options: Partial<Parameters<typeof HebrewCalendar.calendar>[0]> = {},
//   ): Event[] {
//     const hd = this.getHebrewDate(date);
//     // Default options that seem relevant
//     const defaultOptions = {
//       year: hd.greg().getFullYear(),
//       isHebrewYear: false,
//       location: this.loc,
//       candlelighting: true, // Assuming candle lighting times are desired
//       sedrot: true, // Include weekly Torah portion
//       omer: true, // Include Omer count
//       il: this.loc.getIsrael(), // Set based on location
//     };
//     try {
//       return HebrewCalendar.calendar({
//         ...defaultOptions,
//         ...options, // Allow overriding defaults
//         start: date, // Ensure start date is passed if needed by specific use cases
//         // end: date, // Consider adding end date if only fetching for a single day
//       });
//     } catch (error) {
//       console.error(`Error fetching calendar events for ${date}:`, error);
//       return []; // Return empty array on error
//     }
//   }

//   /**
//    * מציאת אירוע לפי תיאורו
//    */
//   getEventByDesc(desc: string, date: Date = new Date()): Event | undefined {
//     // Fetch events only for the specific date to optimize
//     const events = this.getEvents(date, {start: date, end: date});
//     return events.find(ev => ev.getDesc() === desc);
//   }

//   /**
//    * בדיקת שעות חיסכון באור יום (DST)
//    */
//   isDaylightSavingTime(date: Date = new Date()): boolean {
//     // This is a common way but might not be accurate for all timezones/rules
//     // Consider using a library like moment-timezone if high accuracy is needed
//     const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
//     const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
//     return date.getTimezoneOffset() < Math.max(jan, jul);
//   }

//   /**
//    * רשימת תיאורי אירועים ביום
//    */
//   getDayTypes(date: Date = new Date()): string[] {
//     // Fetch events only for the specific date to optimize
//     const events = this.getEvents(date, {start: date, end: date});
//     // Render events in Hebrew as done in Zmanim component example
//     return events.map(ev => ev.render('he'));
//   }

//   /**
//    * כותרת עברית עבור התאריך
//    */
//   getSelectedDayHeader(date: Date = new Date()): string {
//     return this.getHebrewDate(date).toString();
//   }

//   /**
//    * שם העיר המוגדרת בשירות
//    */
//   getPlace(): string {
//     return this.city;
//   }

//   /**
//    * חישוב אורך שעה הלכתית ביחס לשעת החורף
//    * Note: This calculates Sha'ah Zmanit in milliseconds.
//    */
//   getRelativeHour(date: Date = new Date()): number | null {
//     try {
//       const z = this.getZmanim(date);
//       const sunrise = z.sunrise();
//       const sunset = z.sunset();
//       if (sunrise instanceof Date && sunset instanceof Date) {
//         const sr = sunrise.getTime();
//         const ss = sunset.getTime();
//         if (!isNaN(sr) && !isNaN(ss) && ss > sr) {
//           return (ss - sr) / 12;
//         }
//       }
//       return null; // Indicate error or inability to calculate
//     } catch (error) {
//       console.error(`Error calculating relative hour for ${date}:`, error);
//       return null;
//     }
//   }

//   /**
//    * מחזירה את אובייקט המיקום של @hebcal/core
//    */
//   getLocation(): Location {
//     return this.loc;
//   }

//   /**
//    * מחזירה האם המיקום הוא בישראל
//    */
//   isIsrael(): boolean {
//     return this.loc.getIsrael();
//   }
// }
