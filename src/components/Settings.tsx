import React from 'react';
import {ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {setFontSize, setNotifications, setTheme} from '../data/redux/slices/appSettingsSlice';
import {RootState} from '../data/store/rootReducer';
import {ThemeMode, useTheme} from '../utilities/ThemeManager';

interface SettingsProps {
  onClose?: () => void;
}

const Settings: React.FC<SettingsProps> = ({onClose}) => {
  const {colors, userThemePreference, systemIsDark} = useTheme();
  const dispatch = useDispatch();

  // גישה לסטייט של ההגדרות
  const theme = useSelector(
    (state: RootState) => state.appSettings?.theme ?? 'system',
  ) as ThemeMode;
  const fontSize = useSelector((state: RootState) => state.appSettings?.fontSize ?? 'medium') as
    | 'small'
    | 'medium'
    | 'large';
  const notifications = useSelector(
    (state: RootState) => state.appSettings?.notifications ?? false,
  ) as boolean;

  // יצירת אובייקט settings מקומי
  const settings = {
    theme,
    fontSize,
    notifications,
  };

  // טיפול בבחירת נושא
  const handleThemeChange = (newTheme: ThemeMode) => {
    dispatch(setTheme(newTheme));
  };

  // טיפול בבחירת גודל גופן
  const handleFontSizeChange = (newSize: 'small' | 'medium' | 'large') => {
    dispatch(setFontSize(newSize));
  };

  // טיפול בשינוי הגדרת התראות
  const handleNotificationsChange = (enabled: boolean) => {
    dispatch(setNotifications(enabled));
  };

  // יצירת סגנונות דינמיים המבוססים על נושא נוכחי
  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 16,
    },
    header: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 20,
      textAlign: 'center',
    },
    sectionHeader: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'right',
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 16,
    },
    optionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    optionText: {
      fontSize: 16,
      color: colors.text.primary,
    },
    selectedOption: {
      backgroundColor: colors.notification.info,
      borderRadius: 8,
    },
    selectedText: {
      color: colors.accent,
      fontWeight: 'bold',
    },
    themeButtonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 10,
    },
    themeButton: {
      padding: 12,
      borderRadius: 8,
      width: '30%',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeButtonSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.notification.info,
    },
    themeButtonText: {
      fontSize: 14,
      color: colors.text.primary,
    },
    fontSizeRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 10,
      marginBottom: 20,
    },
    fontSizeButton: {
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
      width: '30%',
      borderWidth: 1,
      borderColor: colors.border,
    },
    fontSizeButtonSelected: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: colors.notification.info,
    },
    smallText: {
      fontSize: 12,
      color: colors.text.primary,
    },
    mediumText: {
      fontSize: 16,
      color: colors.text.primary,
    },
    largeText: {
      fontSize: 20,
      color: colors.text.primary,
    },
    closeButton: {
      backgroundColor: colors.primary,
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 20,
    },
    closeButtonText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: 'bold',
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.text.secondary,
      marginBottom: 12,
      textAlign: 'right',
    },
    currentSystemTheme: {
      fontSize: 14,
      color: colors.text.secondary,
      marginTop: 4,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });

  return (
    <ScrollView style={dynamicStyles.container}>
      <Text style={dynamicStyles.header}>הגדרות</Text>

      {/* בחירת נושא */}
      <Text style={dynamicStyles.sectionHeader}>נושא</Text>
      <Text style={dynamicStyles.sectionDescription}>בחר את הנושא המועדף עליך להצגת האפליקציה</Text>
      <View style={dynamicStyles.themeButtonContainer}>
        <TouchableOpacity
          style={[
            dynamicStyles.themeButton,
            userThemePreference === 'light' && dynamicStyles.themeButtonSelected,
          ]}
          onPress={() => handleThemeChange('light')}>
          <Text style={dynamicStyles.themeButtonText}>בהיר</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.themeButton,
            userThemePreference === 'dark' && dynamicStyles.themeButtonSelected,
          ]}
          onPress={() => handleThemeChange('dark')}>
          <Text style={dynamicStyles.themeButtonText}>כהה</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.themeButton,
            userThemePreference === 'system' && dynamicStyles.themeButtonSelected,
          ]}
          onPress={() => handleThemeChange('system')}>
          <Text style={dynamicStyles.themeButtonText}>מערכת</Text>
        </TouchableOpacity>
      </View>

      {userThemePreference === 'system' && (
        <Text style={dynamicStyles.currentSystemTheme}>
          נושא נוכחי של המערכת: {systemIsDark ? 'כהה' : 'בהיר'}
        </Text>
      )}

      <View style={dynamicStyles.sectionDivider} />

      {/* בחירת גודל גופן */}
      <Text style={dynamicStyles.sectionHeader}>גודל גופן</Text>
      <Text style={dynamicStyles.sectionDescription}>
        התאם את גודל הטקסט באפליקציה לנוחות הקריאה שלך
      </Text>
      <View style={dynamicStyles.fontSizeRow}>
        <TouchableOpacity
          style={[
            dynamicStyles.fontSizeButton,
            settings.fontSize === 'small' && dynamicStyles.fontSizeButtonSelected,
          ]}
          onPress={() => handleFontSizeChange('small')}>
          <Text style={dynamicStyles.smallText}>קטן</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.fontSizeButton,
            settings.fontSize === 'medium' && dynamicStyles.fontSizeButtonSelected,
          ]}
          onPress={() => handleFontSizeChange('medium')}>
          <Text style={dynamicStyles.mediumText}>בינוני</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            dynamicStyles.fontSizeButton,
            settings.fontSize === 'large' && dynamicStyles.fontSizeButtonSelected,
          ]}
          onPress={() => handleFontSizeChange('large')}>
          <Text style={dynamicStyles.largeText}>גדול</Text>
        </TouchableOpacity>
      </View>

      <View style={dynamicStyles.sectionDivider} />

      {/* הגדרות התראות */}
      <Text style={dynamicStyles.sectionHeader}>התראות</Text>
      <Text style={dynamicStyles.sectionDescription}>
        קבל התראות על זמני תפילה, שיעורים וזמני כניסת שבת
      </Text>
      <View style={dynamicStyles.optionRow}>
        <Text style={dynamicStyles.optionText}>הפעל התראות</Text>
        <Switch
          value={settings.notifications}
          onValueChange={handleNotificationsChange}
          trackColor={{
            false: colors.divider,
            true: colors.notification.success,
          }}
          thumbColor={settings.notifications ? colors.primary : colors.border}
        />
      </View>

      {/* כפתור סגירה */}
      {onClose && (
        <TouchableOpacity style={dynamicStyles.closeButton} onPress={onClose}>
          <Text style={dynamicStyles.closeButtonText}>שמור וסגור</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default Settings;
