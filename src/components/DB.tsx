// import React, {useCallback, useEffect, useState} from 'react';
// import {AppState, AppStateStatus} from 'react-native';
// import RNBootSplash from 'react-native-bootsplash';
// import {useDispatch} from 'react-redux';

// import {useCheckConnectionQuery} from '../data/redux/api/connectionApi';
// import {useGetDbQuery} from '../data/redux/api/dbApi';
// import {useGetHalchYomitQuery} from '../data/redux/api/halchYomitApi';

// import {cacheDbData, cacheHalachYomit, setError} from '../data/redux/slices/cachedDbSlice';

// import {SerializedError} from '@reduxjs/toolkit';
// import {FetchBaseQueryError} from '@reduxjs/toolkit/query';
// import {AppCache, Performance} from '../utilities/PerformanceUtils';
// import RefreshManager from '../utilities/RefreshManager';
// import Dashboard from './Dashboard';
// import ErrorMessage from './common/ErrorMessage';
// import Loader from './common/Loader';

// // Constants for retry logic
// const MAX_AUTO_RETRIES = 2; // Try 2 times automatically after initial failure
// const RETRY_DELAY_MS = 3000; // Wait 3 seconds between retries

// // Helper type guard to check for RTK Query FetchBaseQueryError
// function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
//   return typeof error === 'object' && error != null && 'status' in error;
// }

// // Helper type guard to check for SerializedError
// function isSerializedError(error: unknown): error is SerializedError {
//   return typeof error === 'object' && error != null && 'message' in error;
// }

// // טיפוסים לנתונים שמגיעים מהשרת
// interface DbData {
//   zmanimData?: {
//     zmanim: Array<{name: string; time: string}>;
//     date?: string;
//     location?: string;
//   };
//   tfilaTimeData?: Array<{
//     title: string;
//     time?: string;
//     description?: string;
//   }>;
//   shiorData?: any[];
//   hanzachotData?: Array<{
//     name: string;
//     description?: string;
//     remarks?: string;
//     date?: string;
//   }>;
//   olimData?: Array<{
//     name: string;
//     aliya: string;
//     remarks?: string;
//   }>;
//   [key: string]: any;
// }

// // טיפוס להלכה יומית
// interface HalachaData {
//   texts?: string[];
//   source?: string;
//   timestamp?: string;
// }

// const DB: React.FC = () => {
//   const dispatch = useDispatch();
//   const [hasError, setHasError] = useState<boolean>(false);
//   const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
//   // State for manual retry count (for UI feedback if needed)
//   const [manualRetryCount, setManualRetryCount] = useState<number>(0);
//   // State for automatic retries
//   const [dbAutoRetryCount, setDbAutoRetryCount] = useState<number>(0);
//   const [halachaAutoRetryCount, setHalachaAutoRetryCount] = useState<number>(0);
//   // State to keep loader visible during auto-retries
//   const [isRetrying, setIsRetrying] = useState<boolean>(false);

//   // מידע מה-API של Redux
//   const {
//     data: dbData,
//     isLoading: dbLoading,
//     error: dbError,
//     isSuccess: dbSuccess,
//     refetch: refetchDb,
//   } = useGetDbQuery(undefined, {
//     // כל רענון ינוצל כאפשרות לרענן את המטמון
//     refetchOnMountOrArgChange: true,
//   });

//   const {
//     data: halachData,
//     isLoading: halachLoading,
//     error: halachError,
//     isSuccess: halachSuccess,
//     refetch: refetchHalacha,
//   } = useGetHalchYomitQuery(undefined, {
//     refetchOnMountOrArgChange: true,
//   });

//   const {isLoading: connectionLoading, error: connectionError} = useCheckConnectionQuery(undefined);

//   // הסתרת מסך טעינה בסיום האתחול
//   useEffect(() => {
//     RNBootSplash.hide({fade: true});
//   }, []);

//   const handleAppActivation = useCallback(async (): Promise<void> => {
//     try {
//       // בדיקה האם צריך לרענן נתונים באופן אוטומטי
//       const shouldRefresh = await RefreshManager.shouldRefreshData();

//       if (shouldRefresh) {
//         // console.log('🔄 Auto-refreshing data after app activation'); // Keep console logs for debugging if needed
//         await Performance.measureAsync(async () => {
//           // Reset retry counts before automatic refresh attempt
//           setDbAutoRetryCount(0);
//           setHalachaAutoRetryCount(0);
//           setIsRetrying(false);
//           await Promise.all([refetchDb(), refetchHalacha()]);
//         }, 'Auto refresh data');
//       }
//     } catch (error) {
//       console.error('Error during app activation refresh:', error);
//     }
//   }, [refetchDb, refetchHalacha]);

//   useEffect(() => {
//     const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
//       // אם האפליקציה חוזרת לפעילות
//       if (appState.match(/inactive|background/) && nextAppState === 'active') {
//         handleAppActivation();
//       }
//       setAppState(nextAppState);
//     });

//     return () => {
//       subscription.remove();
//     };
//   }, [appState, handleAppActivation]); // Added handleAppActivation dependency
//   // טיפול בחזרה לפעילות של האפליקציה
//   const handleAppActivationOnce = useCallback(async (): Promise<void> => {
//     try {
//       // בדיקה האם צריך לרענן נתונים באופן אוטומטי
//       const shouldRefresh = await RefreshManager.shouldRefreshData();

//       if (shouldRefresh) {
//         // console.log('🔄 Auto-refreshing data after app activation'); // Keep console logs for debugging if needed
//         await Performance.measureAsync(async () => {
//           // Reset retry counts before automatic refresh attempt
//           setDbAutoRetryCount(0);
//           setHalachaAutoRetryCount(0);
//           setIsRetrying(false);
//           await Promise.all([refetchDb(), refetchHalacha()]);
//         }, 'Auto refresh data');

//         // עדכון זמן הרענון האחרון - moved to success handlers
//         // await RefreshManager.markRefreshComplete('auto');
//       }
//     } catch (error) {
//       console.error('Error during app activation refresh:', error);
//     }
//   }, [refetchDb, refetchHalacha]); // Removed appState as it's handled in its own effect

//   // בדיקת צורך ברענון בטעינה הראשונית
//   useEffect(() => {
//     async function checkInitialRefresh(): Promise<void> {
//       try {
//         // בהתחלה המערכת תמיד תטען נתונים - מטמון או מרוענן
//         const shouldRefresh = await RefreshManager.shouldRefreshData();
//         if (shouldRefresh) {
//           // סימון שהרענון הושלם יתבצע בעת קבלת הנתונים
//           // console.log('🔄 Initial data refresh needed');
//         } else {
//           // console.log('📋 Using cached data, no refresh needed yet');
//         }
//       } catch (error) {
//         console.error('Error checking initial refresh:', error);
//       }
//     }

//     checkInitialRefresh();
//   }, []);

//   // טיפול בנתוני DB כאשר הם מגיעים או נכשלים (עם ניסיון חוזר)
//   useEffect(() => {
//     if (dbSuccess && dbData) {
//       const startTime = Date.now();
//       dispatch(cacheDbData(dbData as DbData));
//       dispatch(setError(''));
//       setDbAutoRetryCount(0); // Reset retry count on success
//       setIsRetrying(false); // Stop showing retry loader on success
//       setHasError(false); // Clear any previous error state

//       const fetchDuration = Date.now() - startTime;
//       RefreshManager.markRefreshComplete('auto', fetchDuration);
//       AppCache.set('db_data', dbData, 1000 * 60 * 30);
//       // console.log('✅ DB data loaded and cached successfully'); // Keep console logs for debugging if needed
//     } else if (dbError) {
//       // Check if the error is retryable (e.g., server error 5xx or network issue)
//       const isRetryable =
//         isFetchBaseQueryError(dbError) &&
//         typeof dbError.status === 'number' &&
//         dbError.status >= 500;
//       // Add other conditions for retry if needed, e.g., network errors often don't have a status or have status 'FETCH_ERROR'

//       if (isRetryable && dbAutoRetryCount < MAX_AUTO_RETRIES) {
//         console.log(
//           `DB fetch failed (attempt ${dbAutoRetryCount + 1}), retrying in ${
//             RETRY_DELAY_MS / 1000
//           }s...`,
//         );
//         setIsRetrying(true); // Show loader during retry wait
//         const timer = setTimeout(() => {
//           refetchDb();
//           setDbAutoRetryCount(prev => prev + 1);
//           // setIsRetrying will be set to false automatically when dbLoading becomes true again, or on success/final failure
//         }, RETRY_DELAY_MS);
//         return () => clearTimeout(timer); // Cleanup timer on unmount or dependency change
//       } else {
//         // Max retries reached or non-retryable error
//         console.error('❌ DB data loading error (final):', dbError);
//         dispatch(setError(JSON.stringify(dbError))); // Stringify error for Redux store
//         setHasError(true);
//         setIsRetrying(false); // Stop showing retry loader
//         RefreshManager.markRefreshFailed('auto');
//         // Keep dbAutoRetryCount as is, or reset if needed for manual retry logic
//       }
//     }
//   }, [dbSuccess, dbData, dbError, dispatch, refetchDb, dbAutoRetryCount]); // Added dependencies

//   // טיפול בנתוני הלכה יומית כאשר הם מגיעים או נכשלים (עם ניסיון חוזר)
//   useEffect(() => {
//     if (halachSuccess && halachData) {
//       dispatch(cacheHalachYomit((halachData as HalachaData).texts || []));
//       setHalachaAutoRetryCount(0); // Reset retry count on success
//       // No need for setIsRetrying here unless Halacha loading independently controls the main loader
//       AppCache.set('halacha_data', halachData, 1000 * 60 * 60); // שעה
//       // console.log('✅ Halacha Yomit data loaded successfully');
//     } else if (halachError) {
//       const isRetryable =
//         isFetchBaseQueryError(halachError) &&
//         typeof halachError.status === 'number' &&
//         halachError.status >= 500;

//       if (isRetryable && halachaAutoRetryCount < MAX_AUTO_RETRIES) {
//         console.log(
//           `Halacha fetch failed (attempt ${halachaAutoRetryCount + 1}), retrying in ${
//             RETRY_DELAY_MS / 1000
//           }s...`,
//         );
//         // Consider if setIsRetrying is needed here based on UI impact
//         const timer = setTimeout(() => {
//           refetchHalacha();
//           setHalachaAutoRetryCount(prev => prev + 1);
//         }, RETRY_DELAY_MS);
//         return () => clearTimeout(timer);
//       } else {
//         console.error('❌ Halacha Yomit loading error (final):', halachError);
//         // Decide if this error alone should trigger the main error screen
//         // setHasError(true); // Potentially set main error only if DB also failed?
//         // setIsRetrying(false); // If applicable
//       }
//     }
//   }, [halachSuccess, halachData, halachError, dispatch, refetchHalacha, halachaAutoRetryCount]); // Added dependencies

//   // טיפול בשגיאת חיבור
//   useEffect(() => {
//     if (connectionError) {
//       // Log a more specific error message if available
//       const errorMessage =
//         connectionError && typeof connectionError === 'object' && 'error' in connectionError
//           ? connectionError.error
//           : JSON.stringify(connectionError);
//       console.error('❌ Connection check error:', errorMessage); // Changed log message slightly
//       // Decide if connection error should trigger the main error screen immediately or allow retries
//       // For now, setting hasError directly as connection check might be fundamental
//       setHasError(true);
//       setIsRetrying(false); // Ensure retrying state is off if connection fails
//     }
//   }, [connectionError]);

//   // סטטוס טעינה כולל - כולל מצב ניסיון חוזר
//   const isLoading = dbLoading || halachLoading || connectionLoading || isRetrying;

//   // ניסיון מחדש ידני במקרה של שגיאה
//   const handleRetry = async (): Promise<void> => {
//     setHasError(false);
//     setIsRetrying(false); // Ensure auto-retry state is reset
//     setDbAutoRetryCount(0); // Reset auto-retry counts
//     setHalachaAutoRetryCount(0);
//     // dispatch(setLoading(true)); // Let RTK isLoading handle this
//     setManualRetryCount(prev => prev + 1); // Increment manual counter

//     try {
//       console.log('🔄 Manually retrying data fetch...');
//       // Resetting auto-retry counts ensures the auto-retry logic can run again if the manual retry fails
//       await Promise.all([refetchDb(), refetchHalacha()]);
//       // Success will be handled by the useEffect hooks
//     } catch (error) {
//       // Error handling for the refetch calls themselves might not be needed here
//       // as the useEffect hooks will catch the errors from the RTK state.
//       // However, log if the Promise.all itself rejects unexpectedly.
//       console.error('Manual Retry Promise.all failed unexpectedly:', error);
//       // Ensure error state is set if something truly exceptional happens here
//       const errorMessage =
//         isFetchBaseQueryError(error) || isSerializedError(error)
//           ? JSON.stringify(error)
//           : String(error);
//       dispatch(setError(errorMessage));
//       setHasError(true);
//       RefreshManager.markRefreshFailed('manual');
//     } finally {
//       // dispatch(setLoading(false)); // Let RTK isLoading handle this
//       // Do not set isRetrying here, let the loading states handle it
//     }
//   };

//   // הצגת מסך טעינה
//   if (isLoading) {
//     // Provide more context if retrying
//     const message = isRetrying ? 'מנסה להתחבר שוב...' : 'טוען נתונים מהשרת...';
//     return <Loader message={message} />;
//   }

//   // הצגת שגיאה רק אם אין נתונים כלל והתרחשה שגיאה סופית
//   // Also check connectionError specifically if it should block UI
//   const showFatalError = hasError && (!dbData || !halachData); // Show error if essential data is missing after retries/errors

//   if (showFatalError) {
//     return (
//       <ErrorMessage
//         error="אירעה שגיאה בעת טעינת נתונים. אנא בדוק את החיבור לאינטרנט ונסה שוב."
//         retry={handleRetry} // Manual retry button
//       />
//     );
//   }

//   // הצגת הלוח הראשי
//   // Ensure dbData and halachData are passed even if potentially undefined initially or after errors,
//   // Dashboard should handle potentially missing data gracefully.
//   return (
//     <Dashboard
//       dbError={dbError} // Pass final errors
//       halachError={halachError}
//       connectionError={connectionError}
//       dbData={dbData as DbData | undefined} // Allow undefined
//       halachData={halachData as HalachaData | undefined} // Allow undefined
//       onRefresh={handleRetry} // Pass manual retry handler
//       retryCount={manualRetryCount} // Pass manual retry count for potential UI feedback
//     />
//   );
// };

// export default DB;
import React, {useCallback, useEffect, useState} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import {useDispatch} from 'react-redux';

import {useCheckConnectionQuery} from '../data/redux/api/connectionApi';
import {useGetDbQuery} from '../data/redux/api/dbApi';
import {useGetHalchYomitQuery} from '../data/redux/api/halchYomitApi';

import {cacheDbData, cacheHalachYomit, setError} from '../data/redux/slices/cachedDbSlice';

import {SerializedError} from '@reduxjs/toolkit';
import {FetchBaseQueryError} from '@reduxjs/toolkit/query';
import {AppCache, Performance} from '../utilities/PerformanceUtils';
import RefreshManager from '../utilities/RefreshManager';
import Dashboard from './Dashboard';
import ErrorMessage from './common/ErrorMessage';
import Loader from './common/Loader';

// Constants for retry logic
const MAX_AUTO_RETRIES = 2; // Try 2 times automatically after initial failure
const RETRY_DELAY_MS = 3000; // Wait 3 seconds between retries

// Helper type guard to check for RTK Query FetchBaseQueryError
function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

// Helper type guard to check for SerializedError
function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error;
}

// Types for server data
interface DbData {
  zmanimData?: {
    zmanim: Array<{name: string; time: string}>;
    date?: string;
    location?: string;
  };
  tfilaTimeData?: Array<{
    title: string;
    time?: string;
    description?: string;
  }>;
  shiorData?: any[];
  hanzachotData?: Array<{
    name: string;
    description?: string;
    remarks?: string;
    date?: string;
  }>;
  olimData?: Array<{
    name: string;
    aliya: string;
    remarks?: string;
  }>;
  [key: string]: any;
}

interface HalachaData {
  texts?: string[];
  source?: string;
  timestamp?: string;
}

const DB: React.FC = () => {
  const dispatch = useDispatch();
  const [hasError, setHasError] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [manualRetryCount, setManualRetryCount] = useState<number>(0);
  const [dbAutoRetryCount, setDbAutoRetryCount] = useState<number>(0);
  const [halachaAutoRetryCount, setHalachaAutoRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const {
    data: dbData,
    isLoading: dbLoading,
    error: dbError,
    isSuccess: dbSuccess,
    refetch: refetchDb,
  } = useGetDbQuery(undefined, {refetchOnMountOrArgChange: true});

  const {
    data: halachData,
    isLoading: halachLoading,
    error: halachError,
    isSuccess: halachSuccess,
    refetch: refetchHalacha,
  } = useGetHalchYomitQuery(undefined, {refetchOnMountOrArgChange: true});

  const {isLoading: connectionLoading, error: connectionError} = useCheckConnectionQuery(undefined);

  // Hide boot splash when app initializes
  useEffect(() => {
    RNBootSplash.hide({fade: true});
  }, []);

  const handleAppActivation = useCallback(async (): Promise<void> => {
    try {
      const shouldRefresh = await RefreshManager.shouldRefreshData();
      if (shouldRefresh) {
        await Performance.measureAsync(async () => {
          setDbAutoRetryCount(0);
          setHalachaAutoRetryCount(0);
          setIsRetrying(false);
          await Promise.all([refetchDb(), refetchHalacha()]);
        }, 'Auto refresh data');
      }
    } catch (error) {
      console.error('Error during app activation refresh:', error);
    }
  }, [refetchDb, refetchHalacha]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.match(/inactive|background/) && nextState === 'active') {
        handleAppActivation();
      }
      setAppState(nextState);
    });
    return () => subscription.remove();
  }, [appState, handleAppActivation]);

  useEffect(() => {
    async function checkInitialRefresh() {
      try {
        const shouldRefresh = await RefreshManager.shouldRefreshData();
        if (shouldRefresh) {
          console.log('🔄 Initial refresh required');
          await Performance.measureAsync(async () => {
            setDbAutoRetryCount(0);
            setHalachaAutoRetryCount(0);
            setIsRetrying(false);
            await Promise.all([refetchDb(), refetchHalacha()]);
          }, 'Initial refresh data');
        } else {
          console.log('📋 No initial refresh needed, using cached data');
        }
      } catch (error) {
        console.error('Error checking initial refresh:', error);
      }
    }
    checkInitialRefresh();
  }, []);

  useEffect(() => {
    if (dbSuccess && dbData) {
      const start = Date.now();
      dispatch(cacheDbData(dbData as DbData));
      dispatch(setError(''));
      setDbAutoRetryCount(0);
      setIsRetrying(false);
      setHasError(false);

      const duration = Date.now() - start;
      RefreshManager.markRefreshComplete('auto', duration);
      AppCache.set('db_data', dbData, 1000 * 60 * 30);
    } else if (dbError) {
      const isRetryable =
        isFetchBaseQueryError(dbError) &&
        typeof dbError.status === 'number' &&
        dbError.status >= 500;
      if (isRetryable && dbAutoRetryCount < MAX_AUTO_RETRIES) {
        setIsRetrying(true);
        const timer = setTimeout(() => {
          refetchDb();
          setDbAutoRetryCount(prev => prev + 1);
        }, RETRY_DELAY_MS);
        return () => clearTimeout(timer);
      } else {
        console.error('❌ DB data loading error (final):', dbError);
        dispatch(setError(JSON.stringify(dbError)));
        setHasError(true);
        setIsRetrying(false);
        RefreshManager.markRefreshFailed('auto');
      }
    }
  }, [dbSuccess, dbData, dbError, dispatch, refetchDb, dbAutoRetryCount]);

  useEffect(() => {
    if (halachSuccess && halachData) {
      dispatch(cacheHalachYomit((halachData as HalachaData).texts || []));
      setHalachaAutoRetryCount(0);
      AppCache.set('halacha_data', halachData, 1000 * 60 * 60);
    } else if (halachError) {
      const isRetryable =
        isFetchBaseQueryError(halachError) &&
        typeof halachError.status === 'number' &&
        halachError.status >= 500;
      if (isRetryable && halachaAutoRetryCount < MAX_AUTO_RETRIES) {
        const timer = setTimeout(() => {
          refetchHalacha();
          setHalachaAutoRetryCount(prev => prev + 1);
        }, RETRY_DELAY_MS);
        return () => clearTimeout(timer);
      } else {
        console.error('❌ Halacha Yomit loading error (final):', halachError);
      }
    }
  }, [halachSuccess, halachData, halachError, dispatch, refetchHalacha, halachaAutoRetryCount]);

  useEffect(() => {
    if (connectionError) {
      const msg =
        connectionError && typeof connectionError === 'object' && 'error' in connectionError
          ? connectionError.error
          : JSON.stringify(connectionError);
      console.error('❌ Connection check error:', msg);
      setHasError(true);
      setIsRetrying(false);
    }
  }, [connectionError]);

  const isLoading = dbLoading || halachLoading || connectionLoading || isRetrying;

  const handleRetry = async (): Promise<void> => {
    setHasError(false);
    setIsRetrying(false);
    setDbAutoRetryCount(0);
    setHalachaAutoRetryCount(0);
    setManualRetryCount(prev => prev + 1);

    try {
      await Promise.all([refetchDb(), refetchHalacha()]);
    } catch (error) {
      console.error('Manual Retry failed:', error);
      const msg =
        isFetchBaseQueryError(error) || isSerializedError(error)
          ? JSON.stringify(error)
          : String(error);
      dispatch(setError(msg));
      setHasError(true);
      RefreshManager.markRefreshFailed('manual');
    }
  };

  if (isLoading) {
    const message = isRetrying ? 'מנסה להתחבר שוב...' : 'טוען נתונים מהשרת...';
    return <Loader message={message} />;
  }

  const showFatalError = hasError && (!dbData || !halachData);

  if (showFatalError) {
    return (
      <ErrorMessage
        error="אירעה שגיאה בעת טעינת נתונים. אנא בדוק את החיבור לאינטרנט ונסה שוב."
        retry={handleRetry}
      />
    );
  }

  return (
    <Dashboard
      dbError={dbError}
      halachError={halachError}
      connectionError={connectionError}
      dbData={dbData as DbData | undefined}
      halachData={halachData as HalachaData | undefined}
      onRefresh={handleRetry}
      retryCount={manualRetryCount}
    />
  );
};

export default DB;
