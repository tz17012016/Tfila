import React from 'react';
import {ActivityIndicator, StyleSheet, Text, View, ViewStyle} from 'react-native';
import {useTheme} from '../../utilities/ThemeManager';

// Define the component props type
type SectionStatusProps = {
  loading?: boolean;
  error?: string | null;
  isAvailable?: boolean;
  style?: ViewStyle | ViewStyle[];
  children: React.ReactNode;
};

// Export the type
export type {SectionStatusProps};

/**
 * קומפוננטה עוטפת שמציגה את סטטוס הזמינות של מקטעי תוכן שונים
 * מטפלת במצבי טעינה, שגיאה וזמינות
 */
const SectionStatus: React.FC<SectionStatusProps> = ({
  loading = false,
  error = null,
  isAvailable = true,
  style,
  children,
}) => {
  const {colors} = useTheme();

  // סגנונות דינמיים המבוססים על תמה
  const dynamicStyles = StyleSheet.create({
    errorContainer: {
      backgroundColor: colors.error + '20', // צבע שגיאה עם שקיפות
      padding: 12,
      borderRadius: 6,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
      marginBottom: 16,
    },
    errorText: {
      color: colors.error,
      fontWeight: '500',
    },
    loadingContainer: {
      alignItems: 'center',
      padding: 16,
    },
  });

  // סגנונות סטטיים
  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
  });

  // אם המידע אינו זמין כלל, לא מציג שום דבר
  if (!isAvailable) {
    return null;
  }

  // אם יש שגיאה, מציג הודעת שגיאה
  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={dynamicStyles.errorContainer}>
          <Text style={dynamicStyles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // אם המידע בטעינה, מציג אינדיקטור טעינה
  if (loading) {
    return (
      <View style={[styles.container, style, dynamicStyles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // מצב רגיל - מציג את התוכן
  return <View style={[styles.container, style]}>{children}</View>;
};

export default SectionStatus;
