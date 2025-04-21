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
  shiorimData?: any[];
  hanzchData?: Array<{
    name: string;
    description?: string;
    remarks?: string;
    date?: string;
  }>;
  olieLatoraData?: Array<{
    name: string;
    aliyah: string;
    date?: string;
    notes?: string;
  }>;
  generalMessageData?: {
    message?: string;
    showMessage?: boolean;
  };
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
    console.log('🏁 קומפוננטת DB אותחלה');
  }, []);

  const handleAppActivation = useCallback(async (): Promise<void> => {
    try {
      console.log('📲 האפליקציה חזרה לפעילות, בודק צורך ברענון נתונים...');
      const shouldRefresh = await RefreshManager.shouldRefreshData();
      if (shouldRefresh) {
        console.log('🔄 נדרש רענון נתונים אוטומטי');
        await Performance.measureAsync(async () => {
          setDbAutoRetryCount(0);
          setHalachaAutoRetryCount(0);
          setIsRetrying(false);
          console.log('🔄 מתחיל בקשות מקבילות לרענון נתונים...');
          await Promise.all([refetchDb(), refetchHalacha()]);
        }, 'Auto refresh data');
      } else {
        console.log('✅ אין צורך ברענון נתונים, המידע במטמון עדכני');
      }
    } catch (error) {
      console.error('❌ שגיאה ברענון נתונים אוטומטי:', error);
    }
  }, [refetchDb, refetchHalacha]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (appState.match(/inactive|background/) && nextState === 'active') {
        console.log('📲 זיהוי חזרה לפעילות של האפליקציה');
        handleAppActivation();
      }
      setAppState(nextState);
    });
    return () => subscription.remove();
  }, [appState, handleAppActivation]);

  useEffect(() => {
    async function checkInitialRefresh() {
      try {
        console.log('🔍 בדיקה האם נדרש רענון התחלתי של נתונים');
        const shouldRefresh = await RefreshManager.shouldRefreshData();
        if (shouldRefresh) {
          console.log('🔄 נדרש רענון התחלתי');
          await Performance.measureAsync(async () => {
            setDbAutoRetryCount(0);
            setHalachaAutoRetryCount(0);
            setIsRetrying(false);
            await Promise.all([refetchDb(), refetchHalacha()]);
          }, 'Initial refresh data');
        } else {
          console.log('📋 אין צורך ברענון התחלתי, משתמש בנתונים מהמטמון');
        }
      } catch (error) {
        console.error('❌ שגיאה בבדיקת רענון התחלתי:', error);
      }
    }
    checkInitialRefresh();
  }, []);

  useEffect(() => {
    if (dbSuccess && dbData) {
      const start = Date.now();
      console.log('✅ התקבלו נתוני DB מהשרת:', {
        zmanimCount: dbData.zmanimData?.zmanim?.length || 0,
        tfilaTimesCount: dbData.tfilaTimeData?.length || 0,
        shiorimCount: dbData.shiorimData?.length || 0,
        hanzachot: dbData.hanzchData?.length || 0,
        olimLatora: dbData.olieLatoraData?.length || 0,
        generalMessage: dbData.generalMessageData?.message?.substring(0, 30) || '(אין הודעה)',
      });

      dispatch(cacheDbData(dbData as DbData));
      dispatch(setError(''));
      setDbAutoRetryCount(0);
      setIsRetrying(false);
      setHasError(false);

      const duration = Date.now() - start;
      RefreshManager.markRefreshComplete('auto', duration);
      AppCache.set('db_data', dbData, 1000 * 60 * 30);
      console.log(`⏱️ נתוני DB נטענו ונשמרו במטמון (${duration}ms)`);
    } else if (dbError) {
      const isRetryable =
        isFetchBaseQueryError(dbError) &&
        typeof dbError.status === 'number' &&
        dbError.status >= 500;
      if (isRetryable && dbAutoRetryCount < MAX_AUTO_RETRIES) {
        console.log(
          `🔄 שגיאה בטעינת DB (ניסיון ${dbAutoRetryCount + 1}/${MAX_AUTO_RETRIES}), מנסה שוב בעוד ${
            RETRY_DELAY_MS / 1000
          } שניות`,
        );
        setIsRetrying(true);
        const timer = setTimeout(() => {
          refetchDb();
          setDbAutoRetryCount(prev => prev + 1);
        }, RETRY_DELAY_MS);
        return () => clearTimeout(timer);
      } else {
        console.error('❌ שגיאה סופית בטעינת נתוני DB:', dbError);
        dispatch(setError(JSON.stringify(dbError)));
        setHasError(true);
        setIsRetrying(false);
        RefreshManager.markRefreshFailed('auto');
      }
    }
  }, [dbSuccess, dbData, dbError, dispatch, refetchDb, dbAutoRetryCount]);

  useEffect(() => {
    if (halachSuccess && halachData) {
      console.log('✅ התקבלו נתוני הלכה יומית:', {
        textsCount: halachData.texts?.length || 0,
        source: halachData.source || 'לא צוין',
        timestamp: halachData.timestamp || 'לא צוין',
      });

      dispatch(cacheHalachYomit((halachData as HalachaData).texts || []));
      setHalachaAutoRetryCount(0);
      AppCache.set('halacha_data', halachData, 1000 * 60 * 60);
    } else if (halachError) {
      const isRetryable =
        isFetchBaseQueryError(halachError) &&
        typeof halachError.status === 'number' &&
        halachError.status >= 500;
      if (isRetryable && halachaAutoRetryCount < MAX_AUTO_RETRIES) {
        console.log(
          `🔄 שגיאה בטעינת הלכה יומית (ניסיון ${
            halachaAutoRetryCount + 1
          }/${MAX_AUTO_RETRIES}), מנסה שוב בעוד ${RETRY_DELAY_MS / 1000} שניות`,
        );
        const timer = setTimeout(() => {
          refetchHalacha();
          setHalachaAutoRetryCount(prev => prev + 1);
        }, RETRY_DELAY_MS);
        return () => clearTimeout(timer);
      } else {
        console.error('❌ שגיאה סופית בטעינת הלכה יומית:', halachError);
      }
    }
  }, [halachSuccess, halachData, halachError, dispatch, refetchHalacha, halachaAutoRetryCount]);

  useEffect(() => {
    if (connectionError) {
      const msg =
        connectionError && typeof connectionError === 'object' && 'error' in connectionError
          ? connectionError.error
          : JSON.stringify(connectionError);
      console.error('❌ שגיאת חיבור:', msg);
      setHasError(true);
      setIsRetrying(false);
    }
  }, [connectionError]);

  const isLoading = dbLoading || halachLoading || connectionLoading || isRetrying;

  const handleRetry = async (): Promise<void> => {
    console.log('🔄 מנסה לטעון נתונים מחדש (ניסיון ידני)');
    setHasError(false);
    setIsRetrying(false);
    setDbAutoRetryCount(0);
    setHalachaAutoRetryCount(0);
    setManualRetryCount(prev => prev + 1);

    try {
      await Promise.all([refetchDb(), refetchHalacha()]);
    } catch (error) {
      console.error('❌ ניסיון ידני נכשל:', error);
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
        showNetworkCheck
        retryCount={manualRetryCount}
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
