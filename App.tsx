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
      console.log('=== אתחול האפליקציה ===');
      console.log(`פלטפורמה: ${Platform.OS} ${Platform.Version}`);
      console.log(`מצב אפליקציה נוכחי: ${AppState.currentState}`);

      try {
        // בדיקת חיבור ראשונית
        const isOnline = await Connection.isOnline();
        console.log(`🌐 מצב חיבור לאינטרנט: ${isOnline ? 'מחובר' : 'לא מחובר'}`);

        // בדיקת זמן חיבור אחרון
        const lastOnlineTime = await Connection.lastOnline();
        if (lastOnlineTime) {
          console.log(`⏱️ זמן חיבור אחרון: ${lastOnlineTime.toLocaleString()}`);
        } else {
          console.log('⏱️ לא נמצא מידע על חיבור קודם');
        }

        // בדיקה אם המטמון ישן
        const isStale = await Connection.isStale();
        console.log(`📦 מצב מטמון: ${isStale ? 'ישן (יותר משעה)' : 'עדכני'}`);
      } catch (error) {
        console.warn('❌ שגיאה בבדיקת חיבור ראשונית:', error);
      }

      // לחכות מעט לטעינת האפליקציה לפני הצגה
      setTimeout(() => {
        setAppReady(true);
        console.log('✅ האפליקציה מוכנה להצגה');
      }, 500);
    };

    init();
  }, []);

  // הסתרת מסך טעינה כאשר האפליקציה מוכנה
  useEffect(() => {
    if (appReady) {
      RNBootSplash.hide({fade: true});
      console.log('🚀 מסך טעינה הוסר, האפליקציה מוצגת');
    }
  }, [appReady]);

  // ניהול מאזין למצב האפליקציה
  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus): void => {
      console.log(`📱 שינוי מצב אפליקציה: ${appState} -> ${nextAppState}`);

      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        // האפליקציה חזרה לפעילות, נעדכן את מצב החיבור
        console.log('🔄 האפליקציה חזרה לפעילות, בודק מצב חיבור...');
        Connection.isOnline()
          .then(isOnline => console.log(`🌐 מצב חיבור עדכני: ${isOnline ? 'מחובר' : 'לא מחובר'}`))
          .catch(err => console.warn('❌ שגיאה בבדיקת חיבור:', err));
      }

      setAppState(nextAppState);
    },
    [appState],
  );

  // הוספת מאזין למצב האפליקציה
  useEffect(() => {
    console.log('🔔 רישום מאזין למצב האפליקציה');
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      console.log('♻️ ניקוי מאזין למצב האפליקציה');
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
