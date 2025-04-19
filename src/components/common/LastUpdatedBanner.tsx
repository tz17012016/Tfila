import {formatDistanceToNow} from 'date-fns';
import {he} from 'date-fns/locale';
import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../../utilities/ThemeManager';

interface LastUpdatedBannerProps {
  timestamp: string | number | Date | null | undefined;
}

interface FormattedTime {
  relativeTime: string;
  formattedDate: string;
}

const LastUpdatedBanner: React.FC<LastUpdatedBannerProps> = ({timestamp}) => {
  const {colors} = useTheme();

  const formattedTime: FormattedTime = useMemo(() => {
    if (!timestamp)
      return {
        relativeTime: 'לא ידוע',
        formattedDate: 'תאריך לא ידוע',
      };

    try {
      // פורמט יחסי (לפני X דקות)
      const relativeTime = formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: he,
      });

      // פורמט רגיל של שעה ותאריך
      const dateObj = new Date(timestamp);
      const formattedDate = new Intl.DateTimeFormat('he-IL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(dateObj);

      return {relativeTime, formattedDate};
    } catch (error) {
      console.error('Date formatting error:', error);
      return {
        relativeTime: 'תאריך לא תקין',
        formattedDate: String(timestamp),
      };
    }
  }, [timestamp]);

  if (!timestamp) return null;

  // סגנונות דינמיים לפי תמה
  const dynamicStyles = {
    container: {
      backgroundColor: colors.notification.success,
    },
    title: {
      color: colors.success,
    },
    timeText: {
      color: colors.success,
    },
    dateText: {
      color: colors.text.secondary,
    },
  };

  return (
    <View
      style={[styles.container, dynamicStyles.container]}
      accessible={true}
      accessibilityLabel={`מידע עודכן לאחרונה ${formattedTime.relativeTime}`}
      accessibilityHint="מציג מתי המידע באפליקציה עודכן לאחרונה">
      <Text style={[styles.title, dynamicStyles.title]}>עודכן לאחרונה:</Text>
      <Text style={[styles.timeText, dynamicStyles.timeText]}>{formattedTime.relativeTime}</Text>
      <Text style={[styles.dateText, dynamicStyles.dateText]}>{formattedTime.formattedDate}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 10,
  },
});

export default LastUpdatedBanner;
