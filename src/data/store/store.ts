import {configureStore} from '@reduxjs/toolkit';
import {persistStore} from 'redux-persist';

// import enhancers from './enhancers';
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import middleware from './middleware';
import rootReducer, {RootState} from './rootReducer';

// יצירת החנות
export const store = configureStore({
  reducer: rootReducer,
  middleware,
  devTools: false,
  // enhancers,
});

// יצירת Persistor
export const persistor = persistStore(store);

// Export types and hooks
export type AppDispatch = typeof store.dispatch;
export type AppState = ReturnType<typeof store.getState>;

// Utility hooks for TypeScript with Redux
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
