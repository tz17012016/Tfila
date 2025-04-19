import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {UserPreferences} from '../../../models';

// מצב ראשוני עבור העדפות המשתמש
const initialState: UserPreferences = {
  theme: 'system', // ברירת מחדל להשתמש בהגדרות המערכת
  fontSize: 'medium',
  notifications: true,
  lastOpenedDate: null,
};

const appSettingsSlice = createSlice({
  name: 'appSettings',
  initialState,
  reducers: {
    // עדכון הנושא שנבחר
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },

    // עדכון גודל הטקסט
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
    },

    // הפעלה/כיבוי של התראות
    setNotifications: (state, action: PayloadAction<boolean>) => {
      state.notifications = action.payload;
    },

    // עדכון תאריך הפתיחה האחרונה
    updateLastOpenedDate: state => {
      state.lastOpenedDate = new Date().toISOString();
    },

    // עדכון של כל ההגדרות בבת אחת
    updateAllSettings: (state, action: PayloadAction<Partial<UserPreferences>>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
  },
});

// ייצוא פעולות
export const {setTheme, setFontSize, setNotifications, updateLastOpenedDate, updateAllSettings} =
  appSettingsSlice.actions;

export default appSettingsSlice.reducer;
