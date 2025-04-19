// src/data/redux/api/halchYomitApi.ts
import {createApi, FetchBaseQueryError} from '@reduxjs/toolkit/query/react';
import {getHalchYomit} from '../../../utilities/sifria';

export const halchYomitApi = createApi({
  reducerPath: 'halchYomitApi',
  baseQuery: async () => ({data: {}}), // לא בשימוש – נשתמש ב-queryFn בלבד
  endpoints: builder => ({
    getHalchYomit: builder.query<string[], void>({
      async queryFn() {
        try {
          const halachot = await getHalchYomit();

          if (!halachot || halachot.length === 0) {
            return {
              error: {
                status: 404,
                data: 'No halachot found',
              } as FetchBaseQueryError,
            };
          }

          return {data: halachot};
        } catch (err: any) {
          return {
            error: {
              status: 500,
              data: err.message || 'Unknown error in getHalchYomit',
            } as FetchBaseQueryError,
          };
        }
      },
    }),
  }),
});

export const {useGetHalchYomitQuery} = halchYomitApi;
