import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {Connection} from '../../utilities/NetworkUtills';
import {useTheme} from '../../utilities/ThemeManager';

interface ConnectionStatusBannerProps {
  lastUpdated?: Date | string | number | null;
  isFromCache?: boolean;
}

/**
 * קומפוננטה המציגה את מצב החיבור לרשת והאם המידע מגיע מהמטמון
 * @param lastUpdated - זמן העדכון האחרון של הנתונים
 * @param isFromCache - האם הנתונים מגיעים מהמטמון
 */
const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  lastUpdated,
  isFromCache = false,
}) => {
  const {colors} = useTheme();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [lastTimeOnline, setLastTimeOnline] = useState<Date | null>(null);

  useEffect(() => {
    // בדיקת חיבור ראשונית
    async function checkConnection(): Promise<void> {
      const online = await Connection.isOnline();
      setIsOnline(online);

      if (!online) {
        const lastTime = await Connection.lastOnline();
        setLastTimeOnline(lastTime);
      }
    }

    checkConnection();

    // האזנה לשינויים במצב החיבור
    const unsubscribe = Connection.subscribe(online => {
      setIsOnline(online);
      if (!online) {
        Connection.lastOnline().then(setLastTimeOnline);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // אם יש חיבור ולא מוצגים נתוני מטמון - אין צורך להציג את הבאנר
  if (isOnline && !isFromCache) {
    return null;
  }

  // פורמט זמן עדכון אחרון
  const formatTime = (time: Date | string | number | null | undefined): string => {
    if (!time) return 'לא ידוע';

    try {
      return new Date(time).toLocaleString('he-IL', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return String(time);
    }
  };

  const dynamicStyles = {
    container: {
      backgroundColor: isOnline ? colors.notification.success : colors.notification.warning,
    },
    statusText: {
      color: isOnline ? colors.success : colors.warning,
    },
    cacheText: {
      color: colors.text.secondary,
    },
    timeText: {
      color: colors.text.secondary,
    },
    onlineDot: {
      backgroundColor: colors.success,
    },
    offlineDot: {
      backgroundColor: colors.warning,
    },
  };

  return (
    <View
      style={[styles.container, dynamicStyles.container]}
      accessible={true}
      accessibilityLabel={
        isOnline
          ? `מחובר לאינטרנט${isFromCache ? ', מוצג מידע מהמטמון' : ''}`
          : 'לא מחובר לאינטרנט, מוצג מידע מהמטמון'
      }
      accessibilityRole="alert">
      <View style={styles.dotContainer}>
        <View style={[styles.dot, isOnline ? dynamicStyles.onlineDot : dynamicStyles.offlineDot]} />
      </View>

      <View style={styles.textContainer}>
        <Text style={[styles.statusText, dynamicStyles.statusText]}>
          {isOnline ? 'מחובר לאינטרנט' : 'לא מחובר לאינטרנט'}
        </Text>

        {isFromCache && (
          <Text style={[styles.cacheText, dynamicStyles.cacheText]}>מוצג מידע מהמטמון המקומי</Text>
        )}

        {lastUpdated && (
          <Text style={[styles.timeText, dynamicStyles.timeText]}>
            עודכן לאחרונה: {formatTime(lastUpdated)}
          </Text>
        )}

        {!isOnline && lastTimeOnline && (
          <Text style={[styles.timeText, dynamicStyles.timeText]}>
            חיבור אחרון: {formatTime(lastTimeOnline)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    marginVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
  },
  dotContainer: {
    justifyContent: 'center',
    marginRight: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  cacheText: {
    fontSize: 12,
  },
  timeText: {
    fontSize: 11,
    marginTop: 2,
  },
});

export default ConnectionStatusBanner;
