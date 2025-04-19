// src/components/Dashboard.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {AccessibilityInfo, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';

import ConnectionStatusBanner from './common/ConnectionStatusBanner';
import DevErrorBanner from './common/DevErrorBanner';
import LastUpdatedBanner from './common/LastUpdatedBanner';
import OfflineFallbackBanner from './common/OfflineFallbackBanner';
import SectionStatus from './common/SectionStatus';

import {useGetDbQuery} from '../data/redux/api/dbApi';
import {useGetHalchYomitQuery} from '../data/redux/api/halchYomitApi';
import {RootState} from '../data/store/rootReducer';
import {useTheme} from '../utilities/ThemeManager';
import HalachYomit from './HalachYomit';
import Hanzachot from './Hanzachot';
import OlimLatora from './OlimLatora';
import Shiorim from './Shiorim';
import TfilaTimes from './TfilaTimes';
import Zmanim from './Zmanim';

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
      const isEnabled = await AccessibilityInfo.isScreenReaderEnabled();
      setIsScreenReaderEnabled(isEnabled);
    };

    checkScreenReader();

    // האזנה לשינוי מצב קורא המסך
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setIsScreenReaderEnabled,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  // נבדוק אם יש נתונים בנפרד כדי להציג רק את הסקציות הזמינות
  const hasDbData = !!(cachedDb?.dbData || dbData);
  const hasHalacha = !!(cachedDb?.halachYomit || halachData);
  const updatedAt = cachedDb?.updatedAt || null;
  const isFromCache = !dbData || !halachData;

  const {refetch: refetchDb} = useGetDbQuery(undefined);
  const {refetch: refetchHalacha} = useGetHalchYomitQuery(undefined);

  const onRefreshContent = useCallback(async () => {
    setRefreshing(true);
    try {
      // אם יש פונקצית רענון חיצונית - נשתמש בה
      if (onRefresh) {
        await onRefresh();
      } else {
        await Promise.all([refetchDb(), refetchHalacha()]);
      }

      // הודעה קולית למשתמשים עם קורא מסך
      if (isScreenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility('הנתונים עודכנו בהצלחה');
      }
    } catch (err) {
      console.error('Refresh failed:', err);

      // הודעה קולית על שגיאה
      if (isScreenReaderEnabled) {
        AccessibilityInfo.announceForAccessibility('אירעה שגיאה בעת רענון הנתונים');
      }
    } finally {
      setRefreshing(false);
    }
  }, [refetchDb, refetchHalacha, onRefresh, isScreenReaderEnabled]);

  if (__DEV__) {
    console.log('📦 Dashboard cached data:', {
      hasDbData,
      hasHalacha,
      updatedAt,
      retryCount,
    });
  }

  // סגנונות דינמיים המבוססים על התמה הנוכחית
  const dynamicStyles = {
    emptyContainer: {
      backgroundColor: colors.surface,
    },
    emptyText: {
      color: colors.text.primary,
    },
    emptySubtext: {
      color: colors.text.secondary,
    },
    sectionUnavailable: {
      backgroundColor: colors.surface,
    },
    sectionUnavailableText: {
      color: colors.text.disabled,
    },
  };

  if (!hasDbData && !hasHalacha) {
    return (
      <>
        <ConnectionStatusBanner lastUpdated={updatedAt} isFromCache={isFromCache} />
        <View
          style={[styles.emptyContainer, dynamicStyles.emptyContainer]}
          accessible={true}
          accessibilityLabel="אין נתונים זמינים להצגה כרגע. משוך למטה לרענון">
          <Text style={[styles.emptyText, dynamicStyles.emptyText]}>
            אין נתונים זמינים להצגה כרגע.
          </Text>
          <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>משוך למטה לרענון</Text>
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
        {hasDbData ? (
          <>
            <SectionStatus isAvailable={true}>
              <Zmanim />
            </SectionStatus>
            <SectionStatus isAvailable={true}>
              <TfilaTimes />
            </SectionStatus>
            <SectionStatus isAvailable={true}>
              <OlimLatora />
            </SectionStatus>
            <SectionStatus isAvailable={true}>
              <Shiorim />
            </SectionStatus>
            <SectionStatus isAvailable={true}>
              <Hanzachot />
            </SectionStatus>
          </>
        ) : (
          <View
            style={[styles.sectionUnavailable, dynamicStyles.sectionUnavailable]}
            accessible={true}
            accessibilityLabel="מידע על זמני תפילה אינו זמין כרגע">
            <Text style={[styles.sectionUnavailableText, dynamicStyles.sectionUnavailableText]}>
              מידע על זמני תפילה אינו זמין כרגע
            </Text>
          </View>
        )}

        <SectionStatus isAvailable={hasHalacha}>
          {hasHalacha ? (
            <HalachYomit />
          ) : (
            <Text
              style={[styles.sectionUnavailableText, dynamicStyles.sectionUnavailableText]}
              accessible={true}
              accessibilityLabel="הלכה יומית אינה זמינה כרגע">
              הלכה יומית אינה זמינה כרגע
            </Text>
          )}
        </SectionStatus>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  sectionUnavailable: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionUnavailableText: {
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default Dashboard;
