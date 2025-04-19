import React, {useEffect, useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Connection} from '../../utilities/NetworkUtills';
import {useTheme} from '../../utilities/ThemeManager';

interface OfflineFallbackBannerProps {
  onRetry?: () => void;
}

const OfflineFallbackBanner: React.FC<OfflineFallbackBannerProps> = ({onRetry}) => {
  const {colors} = useTheme();
  const [lastOnlineDate, setLastOnlineDate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  useEffect(() => {
    const checkLastOnline = async (): Promise<void> => {
      try {
        // בדיקת זמן מקוון אחרון
        const lastTime = await Connection.lastOnline();
        setLastOnlineDate(lastTime);

        // בדיקה אם עבר יותר מ-60 דקות מאז החיבור האחרון
        const stale = await Connection.isStale(60);
        setIsStale(stale);
      } catch (error) {
        console.error('Error checking last online time:', error);
      }
    };

    checkLastOnline();
  }, []);

  const handleRetry = async (): Promise<void> => {
    const isOnline = await Connection.isOnline();

    if (isOnline && typeof onRetry === 'function') {
      onRetry();
    }
  };

  const formatLastOnlineTime = (): string => {
    if (!lastOnlineDate) return '';

    try {
      return new Intl.DateTimeFormat('he-IL', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(lastOnlineDate);
    } catch (err) {
      console.error('Date formatting error:', err);
      return '';
    }
  };

  const timeInfo = formatLastOnlineTime();

  // סגנונות דינמיים המבוססים על התמה הנוכחית
  const dynamicStyles = {
    container: {
      backgroundColor: colors.notification.warning,
      shadowColor: colors.shadow,
    },
    title: {
      color: colors.warning,
    },
    message: {
      color: colors.text.primary,
    },
    lastTime: {
      color: colors.text.secondary,
    },
    indicator: {
      backgroundColor: colors.warning,
    },
    retryButton: {
      backgroundColor: colors.warning,
    },
  };

  return (
    <View
      style={[styles.container, dynamicStyles.container]}
      accessible={true}
      accessibilityLabel="מצב לא מקוון. מוצג מידע מהמטמון המקומי"
      accessibilityRole="alert">
      <View style={styles.content}>
        <View style={[styles.indicator, dynamicStyles.indicator]} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, dynamicStyles.title]}>מצב לא מקוון</Text>
          <Text style={[styles.message, dynamicStyles.message]}>מוצג מידע מהמטמון המקומי</Text>
          {timeInfo && (
            <Text style={[styles.lastTime, dynamicStyles.lastTime]}>
              חיבור אחרון: {timeInfo}
              {isStale ? ' (יותר משעה)' : ''}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.retryButton, dynamicStyles.retryButton]}
        onPress={handleRetry}
        accessibilityLabel="נסה להתחבר שוב"
        accessibilityRole="button">
        <Text style={styles.retryText}>נסה שוב</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  message: {
    fontSize: 14,
  },
  lastTime: {
    fontSize: 12,
    marginTop: 2,
  },
  retryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 12,
  },
});

export default OfflineFallbackBanner;
