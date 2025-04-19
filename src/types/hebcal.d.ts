declare module '@hebcal/core' {
  export class HDate {
    constructor(date: Date | number | string);
    getDate(): number;
    getMonth(): number;
    getFullYear(): number;
    getDay(): number;
    getMonthName(): string;
    render(locale?: string): string;
  }

  export class Event {
    constructor(date: HDate, desc: string, mask: number, attrs?: any);
    getFlags(): number;
    getDesc(): string;
    render(locale?: string): string;
  }

  export class Location {
    constructor(
      latitude: number,
      longitude: number,
      il: boolean,
      tzid: string,
      cityName?: string,
      countryCode?: string,
      geoid?: number,
    );

    // Add these methods to match the actual API
    getLatitude(): number;
    getLongitude(): number;
    getIsrael(): boolean;
    getTzid(): string;
    getLocationName(): string | null;
    getCountryCode(): string | undefined;
  }

  export class Zmanim {
    constructor(location: Location, date: Date | HDate, timeFormat?: boolean);
    sunrise(): Date;
    sunset(): Date;
    chatzot(): Date;
    minchaGedola(): Date;
    minchaKetana(): Date;
    sofZmanShmaMGA(): Date;
    sofZmanShma(): Date;
    sofZmanTfillaMGA(): Date;
    sofZmanTfilla(): Date;
    tzeit(angle?: number): Date;
    alotHaShachar(): Date;
    misheyakir(): Date;
    plagHaMincha(): Date;
  }

  export class HebrewCalendar {
    static getHolidaysOnDate(date: HDate, il: boolean): Event[];
  }

  export function gematriya(num: number): string;
}
