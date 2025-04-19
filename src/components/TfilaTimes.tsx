import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useGetDbQuery} from '../data/redux/api/dbApi';
import {RootState} from '../data/store/rootReducer';
import {useTheme} from '../utilities/ThemeManager';

// הגדרת הטיפוסים
interface TfilaTime {
  id?: string;
  title: string;
  time?: string;
  description?: string;
}

interface TfilaData {
  tfilaTimeData?: TfilaTime[];
}

const TfilaTimes: React.FC = () => {
  const {colors} = useTheme();
  const {data: liveData, isLoading, error, isSuccess} = useGetDbQuery(undefined);

  const cachedDb = useSelector((state: RootState) => state.cachedDb as TfilaData);

  const tfilaTimeData = isSuccess ? liveData?.tfilaTimeData : cachedDb?.tfilaTimeData;

  const isOffline = !isSuccess && !!cachedDb?.tfilaTimeData;

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    title: {
      fontWeight: 'bold',
      fontSize: 18,
      marginBottom: 4,
      color: isOffline ? colors.warning : colors.text.primary,
    },
    tfilaItem: {
      marginVertical: 2,
      padding: 8,
      backgroundColor: colors.card.background,
      borderRadius: 4,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    itemText: {
      fontSize: 16,
      color: colors.text.primary,
    },
    noDataText: {
      fontStyle: 'italic',
      color: colors.text.secondary,
    },
  });

  // Explicitly formatted the error prop
  const formattedError = error ? (typeof error === 'string' ? error : JSON.stringify(error)) : null;

  // הקוד של ה-SectionStatus
  const sectionStatusContent = (
    <View style={styles.container}>
      <Text style={styles.title}>זמני תפילה {isOffline ? '📡 (מטמון)' : ''}</Text>

      {Array.isArray(tfilaTimeData) && tfilaTimeData.length > 0 ? (
        tfilaTimeData.map((item, index) => (
          <View key={index} style={styles.tfilaItem}>
            <Text style={styles.itemText}>
              {item.title}
              {item.time ? ` - ${item.time}` : ''}
            </Text>
            {item.description && (
              <Text style={[styles.itemText, {fontSize: 14, opacity: 0.8}] as const}>
                {item.description}
              </Text>
            )}
          </View>
        ))
      ) : (
        <Text style={styles.noDataText}>אין נתונים זמינים כרגע</Text>
      )}
    </View>
  );

  // אם המידע אינו זמין כלל, לא מציג שום דבר
  if (!tfilaTimeData) {
    return null;
  }

  // אם יש שגיאה, מציג הודעת שגיאה
  if (formattedError) {
    return (
      <View style={styles.container}>
        <Text style={{color: colors.error}}>{formattedError}</Text>
      </View>
    );
  }

  // אם המידע בטעינה, מציג אינדיקטור טעינה
  if (isLoading) {
    return (
      <View style={styles.container}>
        {/* אינדיקטור טעינה */}
        <Text>טוען...</Text>
      </View>
    );
  }

  // מצב רגיל - מציג את התוכן
  return sectionStatusContent;
};

export default TfilaTimes;
