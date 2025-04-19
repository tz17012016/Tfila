// src/data/store/rootReducer.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import {combineReducers} from '@reduxjs/toolkit';
import {persistReducer} from 'redux-persist';
import {PersistConfig} from 'redux-persist/es/types';

// Slice רגיל שנרצה לשמר
import appSettingsReducer from '../redux/slices/appSettingsSlice';
import cachedDbReducer from '../redux/slices/cachedDbSlice';

// RTK Query APIs – לא עוברים persisting!
import {connectionApi} from '../redux/api/connectionApi';
import {dbApi} from '../redux/api/dbApi';
import {halchYomitApi} from '../redux/api/halchYomitApi';
import {hebcalApi} from '../redux/api/hebcalApi';
import {omerApi} from '../redux/api/omerApi'; // הוספנו את ה-API החדש לספירת העומר
import {parashaApi} from '../redux/api/parashaApi';
import {zmanimApi} from '../redux/api/zmanimApi';

// יוצרים את הבסיס של ה־reducers
const rootReducer = combineReducers({
  cachedDb: cachedDbReducer,
  appSettings: appSettingsReducer,

  // RTK Query reducers – חשוב שיהיו כלולים, אבל לא נשמרים
  [dbApi.reducerPath]: dbApi.reducer,
  [connectionApi.reducerPath]: connectionApi.reducer,
  [halchYomitApi.reducerPath]: halchYomitApi.reducer,
  [hebcalApi.reducerPath]: hebcalApi.reducer,
  [omerApi.reducerPath]: omerApi.reducer, // הוספנו את ה-reducer של העומר
  [parashaApi.reducerPath]: parashaApi.reducer,
  [zmanimApi.reducerPath]: zmanimApi.reducer,
});

// הגדרת טיפוס ה-state
export type RootState = ReturnType<typeof rootReducer>;

// קונפיגורציית persistor רק לסלייסים שאנחנו רוצים לשמר
const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['cachedDb', 'appSettings'], // ❗ הוספתי גם את appSettings לרשימה
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export default persistedReducer;
