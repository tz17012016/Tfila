import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import OmerService, {OmerData} from '../../../utilities/OmerService';

// Create the API
export const omerApi = createApi({
  reducerPath: 'omerApi',
  baseQuery: fetchBaseQuery({baseUrl: '/'}), // We're not using this directly as we use the service
  tagTypes: ['OmerData'],
  endpoints: builder => ({
    getOmerData: builder.query<OmerData | null, void>({
      queryFn: async () => {
        try {
          // Use the OmerService to fetch data
          const omerData = await OmerService.getOmerData();
          return {data: omerData};
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      providesTags: ['OmerData'],
    }),

    refreshOmerData: builder.mutation<OmerData | null, void>({
      queryFn: async () => {
        try {
          // Force refresh from API by clearing cache
          await OmerService.clearCache();
          // Then fetch new data with cache cleared (forcing API call)
          const refreshedData = await OmerService.getOmerData(true);
          // RTK Query requires a properly formed result with a data property
          return {data: refreshedData};
        } catch (error: any) {
          return {error: {status: 'CUSTOM_ERROR', error: error.message || 'Unknown error'}};
        }
      },
      invalidatesTags: ['OmerData'],
    }),
  }),
});

// Export hooks for usage in components
export const {useGetOmerDataQuery, useRefreshOmerDataMutation} = omerApi;
