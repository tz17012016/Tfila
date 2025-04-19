import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createApi,
  fetchBaseQuery,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
  QueryReturnValue,
} from '@reduxjs/toolkit/query/react';
import { addDays } from 'date-fns';
import { isAlive } from '../../../utilities/baseUrl';
// import hebcalService from '../../../utilities/HebcalService';
import { Connection } from '../../../utilities/NetworkUtills';
// Use Location from @hebcal/core for type compatibility

// מפתחות אחסון
const CACHED_DB_KEY = '@cached_db_data';
const CACHE_EXPIRY_KEY = '@cached_db_expiry';

// Development logging
const logDev = (message: string) => {
  if (__DEV__) {
    console.log(message);
  }
};

// סוגי נתונים
interface ScreenTimerData {
  [key: string]: any;
}
interface TfilaTimeData {
  title: string;
  time?: string;
  description?: string;
  [key: string]: any;
}
interface OlieLatoraData {
  name: string;
  aliyah: string;
  date?: string;
  notes?: string;
  [key: string]: any;
}
interface ShiorimData {
  title: string;
  rav?: string;
  time?: string;
  day?: string | number;
  location?: string;
  description?: string;
  [key: string]: any;
}
interface HanzchData {
  name: string;
  description?: string;
  remarks?: string;
  date?: string;
  [key: string]: any;
}
interface GeneralMessageData {
  message?: string;
  showMessage?: boolean;
  [key: string]: any;
}
interface ZmanimData {
  zmanim?: Array<{name: string; time: string; description?: string}>;
  date?: string;
  location?: string;
  [key: string]: any;
}
interface DbData {
  zmanimData: ZmanimData;
  screenTimerData: ScreenTimerData;
  tfilaTimeData: TfilaTimeData[];
  olieLatoraData: OlieLatoraData[];
  shiorimData: ShiorimData[];
  hanzchData: HanzchData[];
  generalMessageData: GeneralMessageData;
  [key: string]: any;
}
// interface GetZmanimDataResult {
//   SunSet: string;
//   SunRise: string;
//   HebrewDate?: string;
//   Date?: string;
//   [key: string]: any;
// }

export const dbApi = createApi({
  reducerPath: 'dbApi',
  baseQuery: fetchBaseQuery({baseUrl: '/'}),
  endpoints: builder => ({
    getDb: builder.query<DbData, void>({
      async queryFn(_, __, ___, fetchWithBQ) {
        
        try {
          const isOnline = await Connection.isOnline();
          if (!isOnline) {
            logDev('🔌 Device offline, using cached data');
            return await getCachedData();
          }
          const base = await isAlive();
          if (!base) {
            logDev('🔌 Server unreachable, using cached data');
            return await getCachedData();
          }
          const endpoints = [
            'zmanim',
            'screenTimer',
            'tfilaTime',
            'olieLatora',
            'shiorim',
            'hanzch',
            'generalMessage',
          ];
          const responses = await Promise.all(
            endpoints.map(ep => fetchWithBQ(`${base}/api/${ep}`)),
          );
          const hasError = responses.some(res => res.error || !res.data);
          if (hasError) {
            const errRes = responses.find(res => res.error) as QueryReturnValue<any, any>;
            const status = errRes.error?.status ?? 'unknown';
            const message =
              typeof errRes.error?.data === 'string' ? errRes.error.data : 'Unknown error';
            return {error: {status, data: message, error: message}};
          }
          const [
            zmanimData,
            screenTimerData,
            tfilaTimeData,
            olieLatoraData,
            shiorimData,
            hanzchData,
            generalMessageData,
          ] = responses.map(res => res.data);

          // Get zmanim with proper error handling
          // let zmanimData = hebcalService.getStandardZmanim();
          // console.log('zmanimData', zmanimData);
          // try {
          //   // Use hebcalService instead of the old getZmanim function
          //   logDev(
          //     `Using default Tel Aviv service for zmanim calculation`,
          //   );
          //   zmanimData = hebcalService.getStandardZmanim();

          //   // Basic validation of required fields
          //   if (!zmanimData?.SunSet || !zmanimData?.SunRise) {
          //     logDev('Missing critical zmanim fields, using fallback');
          //     zmanimData = createFallbackZmanim();
          //   }
          // } catch (zErr) {
          //   console.error('Error fetching zmanim:', zErr);
          //   zmanimData = createFallbackZmanim();
          // }

          const data: DbData = {
            zmanimData: zmanimData as ZmanimData,
            screenTimerData: screenTimerData as ScreenTimerData,
            tfilaTimeData: tfilaTimeData as TfilaTimeData[],
            olieLatoraData: olieLatoraData as OlieLatoraData[],
            shiorimData: shiorimData as ShiorimData[],
            hanzchData: hanzchData as HanzchData[],
            generalMessageData: generalMessageData as GeneralMessageData,
          };

          await cacheData(data);
          logDev('✅ Fetched and cached DB data');
          return {data};
        } catch (err: any) {
          console.error('DB fetch error:', err);
          const cached = await getCachedData();
          if (cached.data) return cached;
          const message = err instanceof Error ? err.message : 'Unknown error';
          return {error: {status: 500, data: message, error: message}};
        }
      },
    }),
  }),
});

export const {useGetDbQuery} = dbApi;

async function cacheData(data: DbData): Promise<boolean> {
  try {
    await AsyncStorage.setItem(CACHED_DB_KEY, JSON.stringify(data));
    const today = new Date();

    // Get sunset time for cache expiry with error handling
    let sunsetTime = '18:00'; // Default fallback
    // try {
    //   // const zmToday = hebcalService.getStandardZmanim(today);
    //   const zmToday = hebcalService.getStandardZmanim(today);
    //   if (zmToday && zmToday.SunSet) {
    //     sunsetTime = zmToday.SunSet;
    //   }
    // } catch (e) {
    //   console.error('Error getting sunset for cache expiry:', e);
    // }

    // Parse sunset time and set expiry
    let [h, m] = sunsetTime.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) {
      h = 18;
      m = 0;
    }

    let expiry = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m);
    if (today > expiry) {
      const tomorrow = addDays(today, 1);
      // try {
      //   const zmTom = hebcalService.getStandardZmanim(tomorrow);
      //   if (zmTom && zmTom.SunSet) {
      //     [h, m] = zmTom.SunSet.split(':').map(Number);
      //     if (isNaN(h) || isNaN(m)) {
      //       h = 18;
      //       m = 0;
      //     }
      //   }
      // } catch (e) {
      //   console.error('Error getting tomorrow sunset for cache:', e);
      // }
      expiry = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), h, m);
    }

    await AsyncStorage.setItem(CACHE_EXPIRY_KEY, expiry.toISOString());
    return true;
  } catch (e: any) {
    console.error('Failed caching DB data:', e);
    return false;
  }
}

// Create a fallback zmanim object when calculations fail
// function createFallbackZmanim(): GetZmanimDataResult {
//   const now = new Date();
//   return {
//     HebrewDate: 'לא זמין',
//     SunRise: '06:00',
//     SunSet: '18:00',
//     MidDay: '12:00',
//     MinhaGedola: '13:00',
//     MinhaKtana: '16:00',
//     SofZmanKriatShmaMagen: '08:00',
//     SofZmanKriatShmaGra: '09:00',
//     Date: now.toLocaleDateString('he-IL'),
//     Place: 'ת"א',
//     RelativeHour: 60,
//     ZmanTalitVeTfilin: '05:30',
//     Parasha: '',
//     ParashaOnly: '',
//     Method: 'חזון שמים - הרב עובדיה יוסף',
//     MozaeyShabat: '19:00',
//     RabenuTam: '19:30',
//     SelectedDayHeader: now.toLocaleDateString('he-IL', { weekday: 'long' }),
//     Daytype: '',
//     Text: null,
//   };
// }

async function getCachedData(): Promise<
  QueryReturnValue<DbData, FetchBaseQueryError, FetchBaseQueryMeta | undefined>
> {
  try {
    const expiryStr = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
    if (expiryStr) {
      const expiry = new Date(expiryStr);
      if (new Date() > expiry && (await Connection.isOnline())) {
        logDev('🕒 Cached data expired');
        return {
          error: {
            status: 'CUSTOM_ERROR',
            data: 'Cached data expired and online',
            error: 'Cached data expired and online',
          },
        };
      }
    }
    const raw = await AsyncStorage.getItem(CACHED_DB_KEY);
    if (!raw) {
      return {
        error: {
          status: 'CUSTOM_ERROR',
          data: 'No cached data available',
          error: 'No cached data available',
        },
      };
    }
    const dataObj = JSON.parse(raw) as DbData;
    logDev('📦 Using cached DB data');
    return {
      data: dataObj,
      meta: {source: 'cache', cachedAt: await AsyncStorage.getItem(CACHE_EXPIRY_KEY)} as any,
    };
  } catch (e: any) {
    console.error('Cache retrieval error:', e);
    return {
      error: {
        status: 'FETCH_ERROR',
        data: e.message || 'Cache error',
        error: e.message || 'Cache error',
      },
    };
  }
}
