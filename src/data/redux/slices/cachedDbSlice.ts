import {PayloadAction, createSlice} from '@reduxjs/toolkit';

// הגדרת טיפוסים
export interface ZmanimData {
  zmanim?: Array<{
    name: string;
    time: string;
    description?: string;
  }>;
  location?: string;
  date?: string;
}

export interface DbData {
  zmanimData?: ZmanimData;
  // הוסף עוד שדות לפי הצורך
  [key: string]: any;
}

export interface CachedDbState {
  dbData: DbData | null;
  halachYomit: string[] | null;
  updatedAt: string | null;
  isLoading: boolean;
  error: string | null;
  lastSyncStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

// מצב התחלתי
const initialState: CachedDbState = {
  dbData: null,
  halachYomit: null,
  updatedAt: null,
  isLoading: false,
  error: null,
  lastSyncStatus: 'idle', // 'idle', 'loading', 'succeeded', 'failed'
};

const cachedDbSlice = createSlice({
  name: 'cachedDb',
  initialState,
  reducers: {
    cacheDbData: (state, action: PayloadAction<DbData>) => {
      state.dbData = action.payload;
      state.updatedAt = new Date().toISOString();
      state.lastSyncStatus = 'succeeded';
      state.error = null;
    },
    cacheHalachYomit: (state, action: PayloadAction<string[]>) => {
      state.halachYomit = action.payload;
      state.lastSyncStatus = 'succeeded';
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
      if (action.payload) {
        state.lastSyncStatus = 'loading';
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
      state.lastSyncStatus = 'failed';
    },
    clearErrors: state => {
      state.error = null;
    },
  },
});

export const {cacheDbData, cacheHalachYomit, setLoading, setError, clearErrors} =
  cachedDbSlice.actions;

export default cachedDbSlice.reducer;
