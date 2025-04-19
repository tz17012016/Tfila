import {FetchBaseQueryError, createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import {isServerAlive} from '../../../utilities/baseUrl';

// הגדרת טיפוס המענה מבדיקת החיבור
interface ConnectionStatus {
  isConnected: boolean;
  timestamp: string;
}

export const connectionApi = createApi({
  reducerPath: 'connectionApi',
  baseQuery: fetchBaseQuery({baseUrl: '/'}),
  endpoints: builder => ({
    checkConnection: builder.query<ConnectionStatus, void>({
      async queryFn() {
        try {
          // בדיקת חיבור לשרת
          const isConnected = await isServerAlive();

          return {
            data: {
              isConnected,
              timestamp: new Date().toISOString(),
            },
          };
        } catch (err: unknown) {
          return {
            error: {
              status: 500,
              data: 'no Connection Please try again later',
            } as FetchBaseQueryError,
          };
        }
      },
    }),
  }),
});

export const {useCheckConnectionQuery} = connectionApi;
