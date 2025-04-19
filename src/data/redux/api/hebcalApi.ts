import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import HebcalApiService from '../../../utilities/HebcalApiService';

// Define types for our responses
export interface ZmanItem {
  name: string;
  time: string;
  parsedTime: string | null;
  description?: string;
}

export interface HebrewEvent {
  title: string;
  category: string;
  date: string;
  hebrew: string;
  memo?: string;
}

export interface HebcalData {
  zmanim: ZmanItem[];
  hebrewEvents: HebrewEvent[];
  hebrewDate: string;
  isShabbat: boolean;
  parasha: string | null;
}

// Create the API
export const hebcalApi = createApi({
  reducerPath: 'hebcalApi',
  baseQuery: fetchBaseQuery({baseUrl: '/'}), // We're not using this directly as we use the service
  tagTypes: ['HebcalData'],
  endpoints: builder => ({
    getTodayEvents: builder.query<HebcalData, void>({
      queryFn: async () => {
        try {
          // Use the existing HebcalApiService to fetch data
          const todayEvents = await HebcalApiService.getTodayEvents();
          const parashaInfo = await HebcalApiService.getWeeklyParasha();

          // Extract and format zmanim items from events
          const zmanItems = extractZmanimFromEvents(todayEvents);

          // Check if today is Shabbat based on events
          const isShabbatDay = todayEvents.some(
            event =>
              event.category === 'candles' ||
              event.category === 'havdalah' ||
              (event.title && event.title.includes('שבת')) ||
              event.category === 'parashat',
          );

          // Get Hebrew date from the first event
          let hebrewDate = '';
          if (todayEvents.length > 0 && todayEvents[0].date) {
            const eventDate = new Date(todayEvents[0].date);
            const options = {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            } as Intl.DateTimeFormatOptions;
            hebrewDate = eventDate.toLocaleDateString('he-IL', options);
          }

          return {
            data: {
              zmanim: zmanItems,
              hebrewEvents: todayEvents,
              hebrewDate,
              isShabbat: isShabbatDay,
              parasha: parashaInfo ? parashaInfo.hebrew || parashaInfo.title : null,
            },
          };
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      providesTags: ['HebcalData'],
    }),

    getEventsByDate: builder.query<HebcalData, Date>({
      queryFn: async date => {
        try {
          // Use the existing HebcalApiService to fetch data for specific date
          const events = await HebcalApiService.getEventsByDate(date);
          const parashaInfo = await HebcalApiService.getWeeklyParasha();

          // Extract and format zmanim items
          const zmanItems = extractZmanimFromEvents(events);

          // Check if the date is Shabbat
          const isShabbatDay = events.some(
            event =>
              event.category === 'candles' ||
              event.category === 'havdalah' ||
              (event.title && event.title.includes('שבת')) ||
              event.category === 'parashat',
          );

          // Format Hebrew date
          let hebrewDate = '';
          if (events.length > 0 && events[0].date) {
            const eventDate = new Date(events[0].date);
            const options = {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            } as Intl.DateTimeFormatOptions;
            hebrewDate = eventDate.toLocaleDateString('he-IL', options);
          }

          return {
            data: {
              zmanim: zmanItems,
              hebrewEvents: events,
              hebrewDate,
              isShabbat: isShabbatDay,
              parasha: parashaInfo ? parashaInfo.hebrew || parashaInfo.title : null,
            },
          };
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      providesTags: ['HebcalData'],
    }),

    refreshHebcalData: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          // Force refresh from API by clearing cache
          await HebcalApiService.clearCache();
          return {data: undefined};
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      invalidatesTags: ['HebcalData'],
    }),
  }),
});

// Helper function to extract zmanim from events
function extractZmanimFromEvents(events: any[]): ZmanItem[] {
  const zmanimItems: ZmanItem[] = [];

  // Process events to find zmanim
  events.forEach(event => {
    // Skip events that aren't time-related
    if (!event.category || !event.date) return;

    const eventDate = new Date(event.date);
    const eventTimeStr = eventDate.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Handle candle lighting times
    if (event.category === 'candles') {
      zmanimItems.push({
        name: 'הדלקת נרות',
        time: eventTimeStr,
        parsedTime: eventDate ? eventDate.toISOString() : null,
        description: 'זמן הדלקת נרות שבת',
      });
    }

    // Handle havdalah times
    if (event.category === 'havdalah') {
      zmanimItems.push({
        name: 'צאת השבת',
        time: eventTimeStr,
        parsedTime: eventDate ? eventDate.toISOString() : null,
        description: 'זמן צאת השבת/חג',
      });
    }

    // Add other zmanim based on categories or titles
    if (event.category === 'zmanim') {
      zmanimItems.push({
        name: event.title || 'זמן הלכתי',
        time: eventTimeStr,
        parsedTime: eventDate ? eventDate.toISOString() : null,
        description: event.memo || '',
      });
    }
  });

  // Add default zmanim if none were found
  if (zmanimItems.length === 0) {
    const today = new Date();

    // Create simple sunrise/sunset times as placeholders
    const sunrise = new Date(today);
    sunrise.setHours(6, 0, 0);

    const sunset = new Date(today);
    sunset.setHours(18, 0, 0);

    zmanimItems.push(
      {
        name: 'הנץ החמה',
        time: '06:00',
        parsedTime: sunrise.toISOString(),
        description: 'זמן הנץ החמה',
      },
      {
        name: 'שקיעה',
        time: '18:00',
        parsedTime: sunset.toISOString(),
        description: 'זמן שקיעת החמה',
      },
    );
  }

  // Sort by time
  return zmanimItems.sort((a, b) => {
    if (a.parsedTime && b.parsedTime) {
      return a.parsedTime.localeCompare(b.parsedTime);
    }
    return 0;
  });
}

// Export hooks for usage in components
export const {useGetTodayEventsQuery, useGetEventsByDateQuery, useRefreshHebcalDataMutation} =
  hebcalApi;
