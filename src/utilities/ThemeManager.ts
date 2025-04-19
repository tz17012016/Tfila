import React, {createContext, useContext, ReactNode} from 'react';
import {useColorScheme} from 'react-native';
import {useSelector} from 'react-redux';
import {RootState} from '../data/store/rootReducer';

export type ThemeMode = 'light' | 'dark' | 'system';

// הגדרת צבעים עבור נושא בהיר
export const LightTheme = {
  background: '#FFFFFF',
  surface: '#F8F8F8',
  primary: '#077b80',
  secondary: '#4b6584',
  accent: '#0d47a1',
  text: {
    primary: '#212121',
    secondary: '#555555',
    disabled: '#888888',
    inverse: '#FFFFFF',
  },
  border: '#DDDDDD',
  shadow: '#000000',
  success: '#2e7d32',
  warning: '#f9a825',
  error: '#c62828',
  info: '#0288d1',
  card: {
    background: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.15)',
  },
  divider: '#EEEEEE',
  notification: {
    info: '#e3f2fd',
    success: '#e8f5e9',
    warning: '#fff8e1',
    error: '#ffebee',
  },
  statusBar: 'dark-content',
};

// הגדרת צבעים עבור נושא כהה
export const DarkTheme = {
  background: '#121212',
  surface: '#1E1E1E',
  primary: '#0fb0b7', // גרסה בהירה יותר של צבע ה-primary
  secondary: '#6f88a8',
  accent: '#4f83e5',
  text: {
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    disabled: '#666666',
    inverse: '#212121',
  },
  border: '#333333',
  shadow: '#000000',
  success: '#4caf50',
  warning: '#ffca28',
  error: '#ef5350',
  info: '#29b6f6',
  card: {
    background: '#212121',
    shadow: 'rgba(0, 0, 0, 0.5)',
  },
  divider: '#333333',
  notification: {
    info: '#0d3a6a',
    success: '#1c3e21',
    warning: '#4a3700',
    error: '#4a0d0d',
  },
  statusBar: 'light-content',
};

// יצירת קונטקסט עבור תמות
interface ThemeContextType {
  colors: typeof LightTheme;
  dark: boolean;
  userThemePreference: ThemeMode;
  systemIsDark: boolean;
  toggleTheme?: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider עבור תמות
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  // בדיקת מצב המערכת (בהיר/כהה)
  const deviceColorScheme = useColorScheme();

  // העדפת משתמש שמורה ב-Redux
  // אם לא קיים עדיין מצב appSettings, נשתמש בברירת מחדל 'system'
  const userThemePreference = useSelector(
    (state: RootState) => (state as any).appSettings?.theme || 'system',
  ) as ThemeMode;

  // החלטה על הנושא שיוצג
  let activeTheme = LightTheme;

  if (userThemePreference === 'system') {
    // השתמש בהגדרת המערכת
    activeTheme = deviceColorScheme === 'dark' ? DarkTheme : LightTheme;
  } else {
    // השתמש בהעדפת המשתמש
    activeTheme = userThemePreference === 'dark' ? DarkTheme : LightTheme;
  }

  const themeContext = {
    colors: activeTheme,
    dark: activeTheme === DarkTheme,
    userThemePreference,
    systemIsDark: deviceColorScheme === 'dark',
  };

  return React.createElement(ThemeContext.Provider, {value: themeContext}, children);
};

/**
 * Hook לקבלת ערכת הנושא הנוכחית
 * @returns ערכת הנושא הנוכחית
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  const deviceColorScheme = useColorScheme();

  if (context === undefined) {
    // אם אין קונטקסט, יתכן והקומפוננט לא עטוף בThemeProvider
    // נחזיר ערכי ברירת מחדל
    return {
      colors: deviceColorScheme === 'dark' ? DarkTheme : LightTheme,
      dark: deviceColorScheme === 'dark',
      userThemePreference: 'system',
      systemIsDark: deviceColorScheme === 'dark',
    };
  }

  return context;
}

export default {
  LightTheme,
  DarkTheme,
  useTheme,
  ThemeProvider,
};
