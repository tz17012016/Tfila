// src/components/Dashboard.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {AccessibilityInfo, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';

import ConnectionStatusBanner from './common/ConnectionStatusBanner';
import DevErrorBanner from './common/DevErrorBanner';
import LastUpdatedBanner from './common/LastUpdatedBanner';
import OfflineFallbackBanner from './common/OfflineFallbackBanner';

import {RootState} from '../data/store/rootReducer';
import {useTheme} from '../utilities/ThemeManager';
import HalachYomit from './HalachYomit';
import Hanzachot from './Hanzachot';
import OlimLatora from './OlimLatora';
import Shiorim from './Shiorim';
import TfilaTimes from './TfilaTimes';
import Zmanim from './Zmanim';

// פונקציית עזר להמרת אובייקטים למחרוזות JSON מפורמטות בצורה טובה
const formatObjectForDisplay = (obj: any): string => {
  if (obj === null || obj === undefined) return 'לא זמין';

  try {
    if (typeof obj === 'object') {
      // אם זה מערך, נחזיר את אורך המערך
      if (Array.isArray(obj)) {
        return `${obj.length} רשומות`;
      }
      // אחרת, נחזיר את האובייקט כ-JSON מפורמט
      return JSON.stringify(obj, null, 2);
    }
    return String(obj);
  } catch (e) {
    return 'שגיאה בהמרת אובייקט';
  }
};

// טיפוסי נתונים
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
  shiorimData?: Array<{
    title: string;
    rav?: string;
    time?: string;
    day?: string | number;
    location?: string;
    description?: string;
  }>;
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
}

interface HalachaData {
  texts?: string[];
  source?: string;
  timestamp?: string;
}

// טיפוס Props של קומפוננטת Dashboard
interface DashboardProps {
  dbError?: any;
  halachError?: any;
  connectionError?: any;
  dbData?: DbData;
  halachData?: HalachaData;
  onRefresh?: () => Promise<void>;
  retryCount?: number;
}

const Dashboard: React.FC<DashboardProps> = ({
  dbError,
  halachError,
  connectionError,
  dbData,
  halachData,
  onRefresh,
  retryCount = 0,
}) => {
  const {colors} = useTheme();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState<boolean>(false);
  const cachedDb = useSelector((state: RootState) => state.cachedDb);

  // בדיקה האם קורא מסך מופעל
  useEffect(() => {
    const checkScreenReader = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(enabled);
    };
    checkScreenReader();
  }, []);

  useEffect(() => {
    console.log('🔄 לוח ראשי נטען עם נתונים:');

    // הצגת מידע על הנתונים שהועברו מה-DB
    if (dbData) {
      console.log('📋 נתוני DB במקומות שונים:');
      console.log(`  • זמנים: ${formatObjectForDisplay(dbData.zmanimData)}`);
      console.log(`  • זמני תפילה: ${formatObjectForDisplay(dbData.tfilaTimeData)}`);
      console.log(`  • שיעורים: ${formatObjectForDisplay(dbData.shiorimData)}`);
      console.log(`  • הנצחות: ${formatObjectForDisplay(dbData.hanzchData)}`);
      console.log(`  • עולים לתורה: ${formatObjectForDisplay(dbData.olieLatoraData)}`);
      console.log(`  • הודעה כללית: ${formatObjectForDisplay(dbData.generalMessageData)}`);
    } else {
      console.log('❌ אין נתוני DB');
    }

    // הצגת מידע על הלכה יומית
    if (halachData) {
      console.log('📕 נתוני הלכה יומית:');
      console.log(`  • מספר הלכות: ${formatObjectForDisplay(halachData.texts)}`);
      console.log(`  • מקור: ${halachData.source || 'לא צוין'}`);
      console.log(`  • זמן: ${halachData.timestamp || 'לא צוין'}`);
    } else {
      console.log('❌ אין נתוני הלכה יומית');
    }

    // הצגת מידע על שגיאות אם קיימות
    if (dbError || halachError || connectionError) {
      console.log('⚠️ שגיאות בטעינת נתונים:');
      if (dbError) console.log('  • שגיאת DB:', dbError);
      if (halachError) console.log('  • שגיאת הלכה יומית:', halachError);
      if (connectionError) console.log('  • שגיאת חיבור:', connectionError);
    }

    // הצגת מידע על המטמון
    console.log('📦 מידע על המטמון:');
    console.log(`  • זמן עדכון אחרון: ${cachedDb.updatedAt || 'אף פעם'}`);
    console.log(`  • יש שגיאות: ${cachedDb.error ? 'כן' : 'לא'}`);
    console.log(`  • סטטוס סנכרון אחרון: ${cachedDb.lastSyncStatus}`);
  }, [dbData, halachData, dbError, halachError, connectionError, cachedDb]);

  // בדיקה אם המידע מגיע מהמטמון
  const updatedAt = cachedDb.updatedAt;
  const isFromCache =
    (!dbData && cachedDb.dbData) ||
    (!halachData && cachedDb.halachYomit && cachedDb.halachYomit.length > 0);

  const onRefreshContent = useCallback(async () => {
    setRefreshing(true);
    try {
      console.log('🔄 מתחיל רענון תוכן...');
      // אם יש פונקצית רענון חיצונית - נשתמש בה
      if (onRefresh) {
        await onRefresh();
      }

      // הודעה קולית למשתמשים עם קורא מסך
      if (isScreenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility('הנתונים עודכנו בהצלחה');
      }
      console.log('✅ רענון תוכן הושלם בהצלחה');
    } catch (err) {
      console.error('❌ שגיאה ברענון:', err);
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, isScreenReaderEnabled]);

  // מצב טעינה - אם אין נתונים כלל
  if (!dbData && !cachedDb.dbData) {
    console.log('⏳ אין נתונים להצגה, מציג מסך טעינה');
    return (
      <>
        <ConnectionStatusBanner lastUpdated={updatedAt} isFromCache={isFromCache} />
        <View style={styles.loadingContainer}>
          <Text style={{color: colors.text}}>טוען נתונים...</Text>
          <RefreshControl refreshing={refreshing} onRefresh={onRefreshContent} />
        </View>
      </>
    );
  }

  return (
    <>
      <ConnectionStatusBanner lastUpdated={updatedAt} isFromCache={isFromCache} />
      {isFromCache && <OfflineFallbackBanner onRetry={onRefreshContent} />}
      {updatedAt && <LastUpdatedBanner timestamp={updatedAt} />}

      {__DEV__ && (
        <>
          <DevErrorBanner error={dbError} label="DB" />
          <DevErrorBanner error={halachError} label="Halacha Yomit" />
          <DevErrorBanner error={connectionError} label="Connection Check" />
        </>
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefreshContent}
            accessibilityLabel="משוך למטה כדי לרענן את הנתונים"
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }>
        {/* חלק עליון - זמני היום */}
        <Zmanim mini={true} />

        {/* חלק הלכה יומית */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, {color: colors.primary}]}>הלכה יומית</Text>
          <HalachYomit maxLength={400} expandable={true} />
        </View>

        {/* זמני תפילה */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, {color: colors.primary}]}>זמני תפילה</Text>
          <TfilaTimes />
        </View>

        {/* עולים לתורה */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, {color: colors.primary}]}>עולים לתורה</Text>
          <OlimLatora maxItems={3} showDate={true} />
        </View>

        {/* שיעורים */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, {color: colors.primary}]}>שיעורים</Text>
          <Shiorim />
        </View>

        {/* הנצחות */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, {color: colors.primary}]}>הנצחות</Text>
          <Hanzachot maxItems={3} />
        </View>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
});

export default Dashboard;
