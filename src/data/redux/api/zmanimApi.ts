import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import ZmanimService, {ZmanimData} from '../../../utilities/ZmanimService';

// Create the API
export const zmanimApi = createApi({
  reducerPath: 'zmanimApi',
  baseQuery: fetchBaseQuery({baseUrl: '/'}), // We're not using this directly as we use the service
  tagTypes: ['ZmanimData'],
  endpoints: builder => ({
    getZmanimData: builder.query<ZmanimData | null, void>({
      queryFn: async () => {
        try {
          // Use the ZmanimService to fetch data
          const zmanimData = await ZmanimService.getZmanimData();
          return {data: zmanimData};
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      providesTags: ['ZmanimData'],
    }),

    refreshZmanimData: builder.mutation<ZmanimData | null, void>({
      queryFn: async () => {
        try {
          // Force refresh from API by clearing cache
          await ZmanimService.clearCache();
          // Then fetch new data with cache cleared (forcing API call)
          const refreshedData = await ZmanimService.getZmanimData(true);
          // RTK Query requires a properly formed result with a data property
          return {data: refreshedData};
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      invalidatesTags: ['ZmanimData'],
    }),
  }),
});

// Export hooks for usage in components
export const {useGetZmanimDataQuery, useRefreshZmanimDataMutation} = zmanimApi;
