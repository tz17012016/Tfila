// src/components/common/LastUpdatedFromCache.tsx
import {format, formatDistanceToNow, isValid, parseISO} from 'date-fns';
import {he} from 'date-fns/locale';
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {store} from '../../data/store/store'; // תיקון היבוא - שימוש ב-named import

type RootState = ReturnType<typeof store.getState>; // הגדרת הטיפוס מקומית

const LastUpdatedFromCache: React.FC = () => {
  const updatedAtRaw = useSelector((state: RootState) => state.cachedDb?.updatedAt);

  if (!updatedAtRaw) return null;

  // תמיכה גם בתאריכי string וגם timestamp
  const parsedDate =
    typeof updatedAtRaw === 'string' ? parseISO(updatedAtRaw) : new Date(updatedAtRaw);

  // בדיקת תקינות כפולה
  if (!isValid(parsedDate) || parsedDate.toString() === 'Invalid Date') return null;

  const formattedDate = format(parsedDate, 'dd/MM/yyyy', {locale: he});
  const formattedTime = format(parsedDate, 'HH:mm', {locale: he});

  // הוספת מידע על זמן שחלף מאז העדכון האחרון
  const timeAgo = formatDistanceToNow(parsedDate, {locale: he, addSuffix: true});

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        🕓 הנתונים השמורים עודכנו לאחרונה בתאריך {formattedDate} בשעה {formattedTime} ({timeAgo})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#e2e3e5',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  text: {
    color: '#383d41',
    textAlign: 'center',
    fontSize: 13,
  },
});

export default LastUpdatedFromCache;
