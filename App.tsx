import React, {useCallback, useEffect, useState} from 'react';
import {
  AppState,
  AppStateStatus,
  LogBox,
  Platform,
  Text as RNText,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from 'react-native';
import RNBootSplash from 'react-native-bootsplash';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import DB from './src/components/DB';
import {persistor, store} from './src/data/store/store';
import {Connection} from './src/utilities/NetworkUtills';
import {ThemeProvider} from './src/utilities/ThemeManager';

// התעלם מאזהרות התפתחות שאינן רלוונטיות
LogBox.ignoreLogs(['ViewPropTypes will be removed', 'AsyncStorage has been extracted']);

// יצירת קומפוננטת Text מותאמת ללא שינוי גודל גופן אוטומטי
const Text = (props: React.ComponentProps<typeof RNText>) => (
  <RNText allowFontScaling={false} {...props} />
);

const App: React.FC = () => {
  const [appReady, setAppReady] = useState<boolean>(false);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  // עבור Android 12+ יש להתחיל את הבדיקות רק אחרי שה-splash screen הוסר
  useEffect(() => {
    const init = async (): Promise<void> => {
      try {
        // בדיקת חיבור ראשונית
        await Connection.isOnline();
      } catch (error) {
        console.warn('Failed initial connection check:', error);
      }

      // לחכות מעט לטעינת האפליקציה לפני הצגה
      setTimeout(() => {
        setAppReady(true);
      }, 500);
    };

    init();
  }, []);

  // הסתרת מסך טעינה כאשר האפליקציה מוכנה
  useEffect(() => {
    if (appReady) {
      RNBootSplash.hide({fade: true});
    }
  }, [appReady]);

  // ניהול מאזין למצב האפליקציה
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus): void => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // האפליקציה חזרה לפעילות, נעדכן את מצב החיבור
        Connection.isOnline().catch(err => console.warn('Connection check failed:', err));
      }

      setAppState(nextAppState);
    },
    [appState],
  );

  // הוספת מאזין למצב האפליקציה
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      // לנקות את כל המאזינים בעת סגירת האפליקציה
      Connection.unsubscribeAll();
    };
  }, [handleAppStateChange]);

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <SafeAreaView style={styles.safeArea}>
            <StatusBar
              backgroundColor="#077b80"
              barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
            />
            <DB />
          </SafeAreaView>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});

export default App;
