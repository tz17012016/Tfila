// /* eslint-disable no-bitwise */
// /// <reference path="../types/hebcal.d.ts" />

// import {Event, HDate, HebrewCalendar, Location, Zmanim, gematriya} from '@hebcal/core';
// import {addDays, format} from 'date-fns';

// // DafYomi placeholder class
// class DafYomi {
//   date: Date;
//   constructor(date: Date) {
//     this.date = date;
//   }
//   render(_lang: string): string {
//     return 'דף יומי';
//   }
// }

// // Event flags constants
// const EVENT_FLAGS = {
//   CHAG: 1,
//   MAJOR_HOLIDAY: 1,
//   LIGHT_CANDLES: 2,
//   YOM_TOV_ENDS: 4,
//   MINOR_HOLIDAY: 8,
//   MINOR_FAST: 16,
//   SPECIAL_SHABBAT: 32,
//   MODERN_HOLIDAY: 64,
//   ROSH_CHODESH: 128,
//   PARASHA: 256,
// };

// // Default location (Tel Aviv) - Ensuring we pass numeric coordinates
// export const TEL_AVIV_LOCATION = new Location(
//   32.109333, // latitude
//   34.855499, // longitude
//   true, // Israel
//   'Asia/Jerusalem', // timezone
//   'Tel Aviv', // city name
//   'IL', // country code
// );

// // Validation helpers
// function isValidLatitude(value: number): boolean {
//   return (
//     typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= -90 && value <= 90
//   );
// }

// function isValidLongitude(value: number): boolean {
//   return (
//     typeof value === 'number' && !isNaN(value) && isFinite(value) && value >= -180 && value <= 180
//   );
// }

// function validateLocation(location: Location): Location {
//   // Direct access to latitude and longitude as numbers
//   const lat = location.getLatitude ? location.getLatitude() : null;
//   const lon = location.getLongitude ? location.getLongitude() : null;

//   // Check if values are null or invalid
//   if (lat === null || lon === null || !isValidLatitude(lat) || !isValidLongitude(lon)) {
//     console.warn(`Invalid location coordinates: lat=${lat}, lon=${lon}. Using fallback.`);
//     // Return a new location with valid coordinates
//     return new Location(32.109333, 34.855499, true, 'Asia/Jerusalem', 'Tel Aviv (fallback)', 'IL');
//   }

//   return location;
// }

// // Data interfaces
// export interface ZmanimData {
//   HebrewDate: string;
//   Method: string;
//   RelativeHour: number;
//   AlotHashahar: string;
//   SunRise: string;
//   SunSet: string;
//   MidDay: string;
//   MinhaGedola: string;
//   MinhaKtana: string;
//   SofZmanKriatShmaMagen: string;
//   SofZmanKriatShmaGra: string;
//   SofZmanTfilaMagen: string;
//   SofZmanTfilaGra: string;
//   ZetHakochavim: string;
//   DafYomi: string;
//   DafYomiYerushalmi: string;
//   Haftara: string;
//   MotzeyShabat: string;
//   ZmanTalitVeTfilin: string;
//   PlagHamincha: string;
//   RabenuTam: string;
//   HadlakatNerot: string;
//   HadlakatNerotNextShabbat: string;
//   MotzeyShabatNextShabbat: string;
//   MozaeyShabat: string;
//   NextMolad: string;
//   NextMoad: string;
//   Parasha: string;
//   ParashaOnly: string;
//   ParashaPlus: string;
//   ParashaDetails: string;
//   Holiday: string;
//   FixedSunRise: string;
//   FixedSunSet: string;
//   VisibleSunRise: string;
//   VisibleSunSet: string;
//   AstronomicalSunRise: string;
//   AstronomicalSetSet: string;
//   Omer: number | null;
//   OmerDescription: string;
//   HaftaraAshkenazi: string;
//   HaftaraSfaradi: string;
//   HaftaraTemani: string;
//   IsDaylightSavingTime: string;
//   Shmita: string;
//   GeshemTal: string;
//   BirkatHashanim: string;
//   Tahanun: string;
//   YaaleVeyavo: string;
//   AlHanisim: string;
//   AtaYatzarta: string;
//   Halel: string;
//   RoshHodesh: string;
//   TefilaChanges: string;
//   MenoratHamaor: string;
//   KriatHatoraToday: string;
//   RambamYomi: string;
//   EruvTavshilin: string;
//   SunsetNextFriday: string;
//   HoshanaText: string;
//   MelechKadosh: string;
//   MelechMishpat: string;
//   StartFast: string;
//   EndFast: string;
//   EndHametzEating: string;
//   EndHametz: string;
//   Date: string;
//   SelectedDayHeader: string;
//   Place: string;
//   Daytype: string;
//   Text: string | null;
// }

// export interface ZmanimResponse {
//   data: ZmanimData;
// }

// // Utility: format a Date to "HH:mm" or return empty string
// function formatTime(date: Date | null): string {
//   if (!date) {
//     return '';
//   }
//   return format(date, 'HH:mm');
// }

// // Hebrew date formatter
// function getHebrewDateFormatted(date: Date): string {
//   const hdate = new HDate(date);
//   const day = gematriya(hdate.getDate());
//   const month = hdate.getMonthName();
//   const year = gematriya(hdate.getFullYear() % 1000);
//   return `${day} ${month} ה'תשפ"${year}`;
// }

// // Hebrew weekday name
// export function getHebrewDayOfWeek(date: Date): string {
//   const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'];
//   return days[date.getDay()];
// }

// // Daf Yomi for date
// function getDafYomi(date: Date): string {
//   const daf = new DafYomi(date);
//   return daf.render('he');
// }

// // Rambam Yomi placeholder
// function getRambamYomi(): string {
//   return "הלכות נזקי ממון א'";
// }

// // Determine special day types
// function getDayType(date: Date, isIsrael = true): string {
//   const hdate = new HDate(date);
//   const events = HebrewCalendar.getHolidaysOnDate(hdate, isIsrael) || [];
//   let types = ',';

//   if (hdate.getDay() === 6) {
//     types += 'shabbat,';
//   }
//   if (events.some(ev => ev.getFlags() & EVENT_FLAGS.MAJOR_HOLIDAY)) {
//     types += 'specialDay,';
//   }
//   if (events.some(ev => ev.getDesc().includes('Chol hamoed'))) {
//     types += 'holhamoed,';
//   }
//   if (events.some(ev => ev.getDesc().includes('Omer'))) {
//     types += 'omer,';
//   }
//   if (events.some(ev => ev.getDesc() === 'Rosh Chodesh')) {
//     types += 'roshChodesh,';
//   }

//   return types;
// }

// // Omer count and description
// function getOmerCount(date: Date): number | null {
//   const hdate = new HDate(date);
//   const events = HebrewCalendar.getHolidaysOnDate(hdate, true) || [];
//   const omerEvent = events.find(ev => ev.getDesc().includes('Omer'));
//   if (!omerEvent) {
//     return null;
//   }
//   const match = omerEvent.getDesc().match(/(\d+)/);
//   return match ? parseInt(match[1], 10) : null;
// }

// function getOmerDescription(count: number | null): string {
//   if (count == null) {
//     return '';
//   }
//   const nums = [
//     'אחד',
//     'שניים',
//     'שלושה',
//     'ארבעה',
//     'חמישה',
//     'שישה',
//     'שבעה',
//     'שמונה',
//     'תשעה',
//     'עשרה',
//     'אחד עשר',
//     'שניים עשר',
//     'שלושה עשר',
//     'ארבעה עשר',
//     'חמישה עשר',
//     'שישה עשר',
//     'שבעה עשר',
//     'שמונה עשר',
//     'תשעה עשר',
//     'עשרים',
//     'עשרים ואחד',
//     'עשרים ושניים',
//     'עשרים ושלושה',
//     'עשרים וארבעה',
//     'עשרים וחמישה',
//     'עשרים ושישה',
//     'עשרים ושבעה',
//     'עשרים ושמונה',
//     'עשרים ותשעה',
//     'שלושים',
//     'שלושים ואחד',
//     'שלושים ושניים',
//     'שלושים ושלושה',
//     'שלושים וארבעה',
//     'שלושים וחמישה',
//     'שלושים ושישה',
//     'שלושים ושבעה',
//     'שלושים ושמונה',
//     'שלושים ותשעה',
//     'ארבעים',
//     'ארבעים ואחד',
//     'ארבעים ושניים',
//     'ארבעים ושלושה',
//     'ארבעים וארבעה',
//     'ארבעים וחמישה',
//     'ארבעים ושישה',
//     'ארבעים ושבעה',
//     'ארבעים ושמונה',
//     'ארבעים ותשעה',
//   ];
//   return `היום ${nums[count - 1]} ימים לעומר`;
// }

// // Tefila changes (Yaale Veyavo, Hallel)
// function getTefilaChanges(date: Date, isIsrael = true): string {
//   const hdate = new HDate(date);
//   const events = HebrewCalendar.getHolidaysOnDate(hdate, isIsrael) || [];
//   let changes = '';

//   if (events.some(ev => ev.getDesc() === 'Rosh Chodesh' || /Pesach|Sukkot/.test(ev.getDesc()))) {
//     changes += 'יעלה ויבוא\n';
//   }
//   if (events.some(ev => ev.getFlags() & EVENT_FLAGS.MAJOR_HOLIDAY)) {
//     changes += 'הלל שלם\n';
//   } else if (
//     events.some(ev => ev.getDesc() === 'Rosh Chodesh' || ev.getDesc().includes('Chol hamoed'))
//   ) {
//     changes += 'הלל בדילוג\n';
//   }

//   return changes;
// }

// // Parasha info
// function getParashaInfo(date: Date, isIsrael = true) {
//   try {
//     const events = HebrewCalendar.getHolidaysOnDate(new HDate(date), isIsrael) || [];
//     const parashaEvent = events.find(ev => ev.getFlags() & EVENT_FLAGS.PARASHA);
//     const holidayEvent = events.find(ev => ev.getFlags() & EVENT_FLAGS.MAJOR_HOLIDAY);
//     let parasha = '',
//       parashaOnly = '';
//     if (parashaEvent) {
//       parasha = parashaEvent.render('he');
//       parashaOnly = parasha;
//     }
//     if (holidayEvent) {
//       parasha = holidayEvent.render('he');
//       parashaOnly = parasha;
//     }
//     return {parasha, parashaOnly, haftaraAshkenazi: '', haftaraSfaradi: ''};
//   } catch {
//     return {parasha: '', parashaOnly: '', haftaraAshkenazi: '', haftaraSfaradi: ''};
//   }
// }

// // Various prayer-book inserts
// function getShmitaYear(date: Date): string {
//   const year = new HDate(date).getFullYear();
//   const ord = (year % 7) + 1;
//   const heb = ['ראשונה', 'שניה', 'שלישית', 'רביעית', 'חמישית', 'שישית', 'שביעית'][ord - 1];
//   return `שנה ${heb} לשמיטה`;
// }

// function getGeshemTal(date: Date): string {
//   const h = new HDate(date);
//   const m = h.getMonth(),
//     d = h.getDate();
//   if ((m === 1 && d >= 15) || (m > 1 && m < 7) || (m === 7 && d < 22)) {
//     return 'מוריד הטל';
//   }
//   return 'משיב הרוח ומוריד הגשם';
// }

// function getBirkatHashanim(date: Date): string {
//   const h = new HDate(date);
//   const m = h.getMonth(),
//     d = h.getDate();
//   if ((m === 8 && d >= 7) || m > 8 || m < 1 || (m === 1 && d < 15)) {
//     return 'ברך עלינו';
//   }
//   return 'ברכנו';
// }

// function getTahanun(date: Date, events: Event[] | null): string {
//   if (!events) {
//     return 'אומרים תחנון';
//   }
//   if (
//     events.some(
//       ev =>
//         ev.getFlags() & (EVENT_FLAGS.MAJOR_HOLIDAY | EVENT_FLAGS.MINOR_HOLIDAY) ||
//         ev.getDesc() === 'Rosh Chodesh' ||
//         /Chanukah|Purim|Omer/.test(ev.getDesc()),
//     )
//   ) {
//     return 'א"א תחנון';
//   }
//   const wd = date.getDay();
//   if (wd === 5 || wd === 6) {
//     return 'א"א תחנון';
//   }
//   return 'אומרים תחנון';
// }

// function getHalel(events: Event[] | null): string {
//   if (!events) {
//     return '';
//   }
//   if (
//     events.some(
//       ev => ev.getFlags() & EVENT_FLAGS.MAJOR_HOLIDAY && !ev.getDesc().includes('Chol hamoed'),
//     )
//   ) {
//     return 'הלל שלם';
//   }
//   if (events.some(ev => ev.getDesc() === 'Rosh Chodesh' || ev.getDesc().includes('Chol hamoed'))) {
//     return 'הלל בדילוג';
//   }
//   return '';
// }

// function getTorahReading(date: Date, events: Event[] | null): string {
//   if (!events) {
//     return '';
//   }
//   const parashaEvent = events.find(ev => ev.getFlags() & EVENT_FLAGS.PARASHA);
//   if (parashaEvent) {
//     return parashaEvent.render('he').replace('פרשת ', '');
//   }
//   const holidayEvent = events.find(ev => ev.getFlags() & EVENT_FLAGS.MAJOR_HOLIDAY);
//   if (holidayEvent) {
//     if (holidayEvent.getDesc().includes('Pesach')) {
//       return 'פסח';
//     }
//     if (holidayEvent.getDesc().includes('Sukkot')) {
//       return 'סוכות';
//     }
//   }
//   const wd = date.getDay();
//   if (wd === 1 || wd === 4) {
//     return 'וידבר';
//   }
//   return '';
// }

// // Subtract/add minutes helpers
// function customAddMinutes(date: Date | null, mins: number): Date | null {
//   if (!date) {
//     return null;
//   }
//   const d = new Date(date);
//   d.setMinutes(d.getMinutes() + mins);
//   return d;
// }

// function customSubMinutes(date: Date | null, mins: number): Date | null {
//   if (!date) {
//     return null;
//   }
//   const d = new Date(date);
//   d.setMinutes(d.getMinutes() - mins);
//   return d;
// }

// // Check DST
// function checkDaylightSavingTime(date: Date): boolean {
//   const jan = new Date(date.getFullYear(), 0, 1);
//   const jul = new Date(date.getFullYear(), 6, 1);
//   return date.getTimezoneOffset() < Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset());
// }

// // Main data builder with validation and single Zmanim instance
// export function getZmanimData(
//   dateInput: Date,
//   locationInput: Location = TEL_AVIV_LOCATION,
//   place: string = 'תל אביב',
// ): ZmanimData {
//   try {
//     // 1. Validate the input date
//     let date = dateInput;
//     if (!(date instanceof Date) || isNaN(date.getTime())) {
//       console.warn(`Invalid date ${date}, using current date`);
//       date = new Date();
//     }

//     // 2. Validate the location object
//     const location = validateLocation(locationInput);

//     // 3. Create a Hebrew date
//     const hdate = new HDate(date);

//     // 4. Create a Zmanim instance with try/catch
//     let zmanimObj: Zmanim;
//     try {
//       // Ensure we use the validated location
//       zmanimObj = new Zmanim(location, hdate, false);
//     } catch (error) {
//       console.error('Error creating Zmanim object:', error);
//       // Return fallback data if Zmanim creation fails
//       return createFallbackZmanimData(date, place);
//     }

//     // Safely get sunrise and sunset
//     let sunrise: Date | null = null;
//     let sunset: Date | null = null;

//     try {
//       sunrise = zmanimObj.sunrise();
//       sunset = zmanimObj.sunset();
//     } catch (error) {
//       console.error('Error getting sunrise/sunset:', error);
//       // Use fallbacks
//       const now = new Date();
//       sunrise = new Date(now);
//       sunrise.setHours(6, 0, 0);
//       sunset = new Date(now);
//       sunset.setHours(18, 0, 0);
//     }

//     // Get holidays/events
//     const events = HebrewCalendar.getHolidaysOnDate(hdate, true) || [];

//     // Get parasha info
//     const {parasha, parashaOnly, haftaraAshkenazi, haftaraSfaradi} = getParashaInfo(date);

//     // Get Omer info
//     const omerCount = getOmerCount(date);
//     const omerDesc = getOmerDescription(omerCount);

//     // Day type & holiday
//     const daytype = getDayType(date);
//     let holiday = '';
//     const holEv = events.find(
//       ev =>
//         (ev.getFlags() & (EVENT_FLAGS.MAJOR_HOLIDAY | EVENT_FLAGS.MINOR_HOLIDAY)) !== 0 ||
//         ev.getDesc().includes('Chol hamoed'),
//     );
//     if (holEv) {
//       holiday = holEv.render('he').replace('פרשת ', '');
//     }

//     // Calculate relative hour safely
//     let relativeHour = 60; // default 60 minutes
//     if (sunrise && sunset) {
//       relativeHour = (sunset.getTime() - sunrise.getTime()) / 12 / 60000;
//     }

//     // Construct full zmanim data safely
//     return {
//       HebrewDate: getHebrewDateFormatted(date),
//       Method: 'חזון שמים - הרב עובדיה יוסף',
//       RelativeHour: relativeHour,
//       AlotHashahar: formatTime(safelyGetZman(() => zmanimObj.alotHaShachar())),
//       SunRise: formatTime(sunrise),
//       SunSet: formatTime(sunset),
//       MidDay: formatTime(safelyGetZman(() => zmanimObj.chatzot())),
//       MinhaGedola: formatTime(safelyGetZman(() => zmanimObj.minchaGedola())),
//       MinhaKtana: formatTime(safelyGetZman(() => zmanimObj.minchaKetana())),
//       SofZmanKriatShmaMagen: formatTime(safelyGetZman(() => zmanimObj.sofZmanShmaMGA())),
//       SofZmanKriatShmaGra: formatTime(safelyGetZman(() => zmanimObj.sofZmanShma())),
//       SofZmanTfilaMagen: formatTime(safelyGetZman(() => zmanimObj.sofZmanTfillaMGA())),
//       SofZmanTfilaGra: formatTime(safelyGetZman(() => zmanimObj.sofZmanTfilla())),
//       ZetHakochavim: formatTime(safelyGetZman(() => zmanimObj.tzeit())),
//       DafYomi: getDafYomi(date),
//       DafYomiYerushalmi: '',
//       Haftara: haftaraAshkenazi,
//       MotzeyShabat: formatTime(safelyGetZman(() => zmanimObj.tzeit())),
//       ZmanTalitVeTfilin: formatTime(safelyGetZman(() => zmanimObj.misheyakir())),
//       PlagHamincha: formatTime(safelyGetZman(() => zmanimObj.plagHaMincha())),
//       RabenuTam: formatTime(safelyGetZman(() => zmanimObj.tzeit())),
//       HadlakatNerot: '',
//       HadlakatNerotNextShabbat: '',
//       MotzeyShabatNextShabbat: '',
//       MozaeyShabat: formatTime(safelyGetZman(() => zmanimObj.tzeit())),
//       NextMolad: '',
//       NextMoad: '',
//       Parasha: parasha,
//       ParashaOnly: parashaOnly,
//       ParashaPlus: '',
//       ParashaDetails: '',
//       Holiday: holiday,
//       FixedSunRise: formatTime(sunrise),
//       FixedSunSet: formatTime(sunset),
//       VisibleSunRise: formatTime(customAddMinutes(sunrise, 3)),
//       VisibleSunSet: formatTime(sunset),
//       AstronomicalSunRise: formatTime(customSubMinutes(sunrise, 1)),
//       AstronomicalSetSet: formatTime(sunset),
//       Omer: omerCount,
//       OmerDescription: omerDesc,
//       HaftaraAshkenazi: haftaraAshkenazi,
//       HaftaraSfaradi: haftaraSfaradi,
//       HaftaraTemani: '',
//       IsDaylightSavingTime: checkDaylightSavingTime(date) ? 'True' : 'False',
//       Shmita: getShmitaYear(date),
//       GeshemTal: getGeshemTal(date),
//       BirkatHashanim: getBirkatHashanim(date),
//       Tahanun: getTahanun(date, events),
//       YaaleVeyavo: events.some(
//         ev => ev.getDesc() === 'Rosh Chodesh' || (ev.getFlags() & EVENT_FLAGS.MAJOR_HOLIDAY) !== 0,
//       )
//         ? 'יעלה ויבוא'
//         : '',
//       AlHanisim: '',
//       AtaYatzarta: '',
//       Halel: getHalel(events),
//       RoshHodesh: events.some(ev => ev.getDesc() === 'Rosh Chodesh') ? 'True' : 'False',
//       TefilaChanges: getTefilaChanges(date),
//       MenoratHamaor: '',
//       KriatHatoraToday: getTorahReading(date, events),
//       RambamYomi: getRambamYomi(),
//       EruvTavshilin: '',
//       SunsetNextFriday: '',
//       HoshanaText: '',
//       MelechKadosh: '',
//       MelechMishpat: '',
//       StartFast: '',
//       EndFast: '',
//       EndHametzEating: '',
//       EndHametz: '',
//       Date: format(date, 'dd/MM/yyyy'),
//       SelectedDayHeader: getHebrewDayOfWeek(date),
//       Place: place,
//       Daytype: daytype,
//       Text: null,
//     };
//   } catch (error) {
//     console.error('Error in getZmanimData:', error);
//     return createFallbackZmanimData(dateInput, place);
//   }
// }

// // Safe getter for zmanim methods that may throw
// function safelyGetZman(getZman: () => Date | null): Date | null {
//   try {
//     return getZman();
//   } catch (error) {
//     console.error('Error getting zman:', error);
//     return null;
//   }
// }

// // Create fallback data when zmanim calculation fails
// function createFallbackZmanimData(date: Date, place: string): ZmanimData {
//   // Removing unused 'now' variable
//   return {
//     HebrewDate: getHebrewDateFormatted(date),
//     Method: 'חזון שמים - הרב עובדיה יוסף (ערכים משוערים)',
//     RelativeHour: 60,
//     AlotHashahar: '05:00',
//     SunRise: '06:00',
//     SunSet: '18:00',
//     MidDay: '12:00',
//     MinhaGedola: '13:00',
//     MinhaKtana: '16:00',
//     SofZmanKriatShmaMagen: '08:00',
//     SofZmanKriatShmaGra: '09:00',
//     SofZmanTfilaMagen: '09:00',
//     SofZmanTfilaGra: '10:00',
//     ZetHakochavim: '19:00',
//     DafYomi: getDafYomi(date),
//     DafYomiYerushalmi: '',
//     Haftara: '',
//     MotzeyShabat: '19:00',
//     ZmanTalitVeTfilin: '05:30',
//     PlagHamincha: '16:30',
//     RabenuTam: '19:30',
//     HadlakatNerot: '',
//     HadlakatNerotNextShabbat: '',
//     MotzeyShabatNextShabbat: '',
//     MozaeyShabat: '19:00',
//     NextMolad: '',
//     NextMoad: '',
//     Parasha: '',
//     ParashaOnly: '',
//     ParashaPlus: '',
//     ParashaDetails: '',
//     Holiday: '',
//     FixedSunRise: '06:00',
//     FixedSunSet: '18:00',
//     VisibleSunRise: '06:03',
//     VisibleSunSet: '18:00',
//     AstronomicalSunRise: '05:59',
//     AstronomicalSetSet: '18:00',
//     Omer: null,
//     OmerDescription: '',
//     HaftaraAshkenazi: '',
//     HaftaraSfaradi: '',
//     HaftaraTemani: '',
//     IsDaylightSavingTime: checkDaylightSavingTime(date) ? 'True' : 'False',
//     Shmita: '',
//     GeshemTal: '',
//     BirkatHashanim: '',
//     Tahanun: '',
//     YaaleVeyavo: '',
//     AlHanisim: '',
//     AtaYatzarta: '',
//     Halel: '',
//     RoshHodesh: '',
//     TefilaChanges: '',
//     MenoratHamaor: '',
//     KriatHatoraToday: '',
//     RambamYomi: getRambamYomi(),
//     EruvTavshilin: '',
//     SunsetNextFriday: '',
//     HoshanaText: '',
//     MelechKadosh: '',
//     MelechMishpat: '',
//     StartFast: '',
//     EndFast: '',
//     EndHametzEating: '',
//     EndHametz: '',
//     Date: format(date, 'dd/MM/yyyy'),
//     SelectedDayHeader: getHebrewDayOfWeek(date),
//     Place: place || 'תל אביב',
//     Daytype: '',
//     Text: null,
//   };
// }

// // getZmanim uses getZmanimData and rolls over past sunset
// export function getZmanim(
//   location: Location = TEL_AVIV_LOCATION,
//   place: string = 'תל אביב',
// ): ZmanimData {
//   try {
//     // Validate location first - use a fallback if validation fails
//     const validatedLocation = validateLocation(location);

//     // Get current date safely
//     const now = new Date();

//     // Use a try-catch specifically for getting today's zmanim
//     let today: ZmanimData;
//     try {
//       today = getZmanimData(now, validatedLocation, place);
//     } catch (error) {
//       console.warn("Error getting today's zmanim, using fallback data");
//       return createFallbackZmanimData(now, place);
//     }

//     // Check if sunset time exists and is valid
//     if (!today.SunSet || today.SunSet === '') {
//       console.warn('No sunset time available, using current date');
//       return getZmanimData(now, validatedLocation, place);
//     }

//     // Safely parse sunset time
//     const [h, m] = today.SunSet.split(':').map(Number);
//     if (isNaN(h) || isNaN(m)) {
//       console.warn('Invalid sunset time format, using current date');
//       return getZmanimData(now, validatedLocation, place);
//     }

//     // Create a valid sunset date
//     try {
//       const sunset = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);

//       // Verify sunset date is valid
//       if (!(sunset instanceof Date) || isNaN(sunset.getTime())) {
//         console.warn('Created invalid sunset date, using current date');
//         return getZmanimData(now, validatedLocation, place);
//       }

//       // Compare and get effective date
//       const effectiveDate = now > sunset ? addDays(now, 1) : now;
//       return getZmanimData(effectiveDate, validatedLocation, place);
//     } catch (dateError) {
//       console.warn('Error creating sunset date, using current date');
//       return getZmanimData(now, validatedLocation, place);
//     }
//   } catch (error) {
//     // Master error handler - never throw, always return fallback
//     console.warn('Error in getZmanim, returning fallback data');
//     return createFallbackZmanimData(new Date(), place);
//   }
// }

// // Create for arbitrary coordinates with validation
// export function createZmanimForLocation(
//   latitude: number,
//   longitude: number,
//   isIsrael = true,
//   timeZone = 'Asia/Jerusalem',
//   place = '',
// ): ZmanimResponse {
//   try {
//     // Validate coordinates first
//     if (!isValidLatitude(latitude) || !isValidLongitude(longitude)) {
//       console.warn(`Invalid coordinates (${latitude},${longitude}), using default location`);
//       return {data: getZmanim()};
//     }

//     // Create a new location with validated coordinates
//     const location = new Location(latitude, longitude, isIsrael, timeZone);
//     const locationName =
//       place || `מיקום מותאם אישית (${latitude.toFixed(2)}, ${longitude.toFixed(2)})`;

//     return {
//       data: getZmanim(location, locationName),
//     };
//   } catch (error) {
//     console.error('Error in createZmanimForLocation:', error);
//     return {
//       data: getZmanim(),
//     };
//   }
// }

// export default {
//   getZmanim,
//   getZmanimData,
//   createZmanimForLocation,
// };
