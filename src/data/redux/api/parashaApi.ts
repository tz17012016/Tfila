import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import ParashaService, {ParashaData} from '../../../utilities/ParashaService';

// Create the API
export const parashaApi = createApi({
  reducerPath: 'parashaApi',
  baseQuery: fetchBaseQuery({baseUrl: '/'}), // We're not using this directly as we use the service
  tagTypes: ['ParashaData'],
  endpoints: builder => ({
    getParashaData: builder.query<ParashaData | null, void>({
      queryFn: async () => {
        try {
          // Use the ParashaService to fetch data
          const parashaData = await ParashaService.getParashaData();
          return {data: parashaData};
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      providesTags: ['ParashaData'],
    }),

    refreshParashaData: builder.mutation<ParashaData | null, void>({
      queryFn: async () => {
        try {
          // Force refresh from API by clearing cache
          await ParashaService.clearCache();
          // Then fetch new data with cache cleared (forcing API call)
          const refreshedData = await ParashaService.getParashaData(true);
          // RTK Query requires a properly formed result with a data property
          return {data: refreshedData};
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      invalidatesTags: ['ParashaData'],
    }),
  }),
});

// Export hooks for usage in components
export const {useGetParashaDataQuery, useRefreshParashaDataMutation} = parashaApi;
