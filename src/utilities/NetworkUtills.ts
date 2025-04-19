import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, {NetInfoState} from '@react-native-community/netinfo';

const NETWORK_STATUS_KEY = '@network_status_cache';
const LAST_ONLINE_TIME_KEY = '@last_online_timestamp';

interface NetworkListener {
  callback: (isOnline: boolean, state: NetInfoState) => void;
  unsubscribe: () => void;
}

export class NetworkUtils {
  static listeners: NetworkListener[] = [];

  // בדיקה חד פעמית אם יש חיבור לאינטרנט
  static async isNetworkAvailable(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();

      // שמירת זמן החיבור האחרון אם יש חיבור
      if (state.isConnected && state.isInternetReachable) {
        await AsyncStorage.setItem(LAST_ONLINE_TIME_KEY, new Date().toISOString());
        await AsyncStorage.setItem(NETWORK_STATUS_KEY, JSON.stringify(state));
      }

      return Boolean(state.isConnected && state.isInternetReachable);
    } catch (error) {
      console.error('Network check error:', error);
      return false;
    }
  }

  // האזנה לשינויים בחיבור (listener בזמן אמת)
  static subscribeToNetworkChanges(
    callback: (isOnline: boolean, state: NetInfoState) => void,
  ): () => void {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable);

      // שמירת זמן החיבור האחרון אם יש חיבור
      if (isOnline) {
        AsyncStorage.setItem(LAST_ONLINE_TIME_KEY, new Date().toISOString());
        AsyncStorage.setItem(NETWORK_STATUS_KEY, JSON.stringify(state));
      }

      callback(isOnline, state);
    });

    // שומר את המאזין במערך לשימוש עתידי
    this.listeners.push({callback, unsubscribe});

    return unsubscribe;
  }

  // הסרת כל המאזינים
  static unsubscribeAll(): void {
    this.listeners.forEach(listener => {
      if (listener && typeof listener.unsubscribe === 'function') {
        listener.unsubscribe();
      }
    });
    this.listeners = [];
  }

  // קבלת זמן החיבור האחרון
  static async getLastOnlineTime(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_ONLINE_TIME_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Failed to get last online time:', error);
      return null;
    }
  }

  // בדיקה האם עברו יותר מ-X דקות מאז החיבור האחרון
  static async isStale(minutes = 60): Promise<boolean> {
    const lastOnline = await this.getLastOnlineTime();
    if (!lastOnline) return true;

    const now = new Date();
    const diffMs = now.getTime() - lastOnline.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    return diffMinutes > minutes;
  }

  // בדיקת האם היה חיבור אי פעם
  static async hasEverBeenOnline(): Promise<boolean> {
    const lastOnline = await this.getLastOnlineTime();
    return lastOnline !== null;
  }

  // שמירת מצב רשת ידני (שימושי לבדיקות או מצבים מיוחדים)
  static async markAsOnline(): Promise<void> {
    await AsyncStorage.setItem(LAST_ONLINE_TIME_KEY, new Date().toISOString());
  }
}

// ממשק חיצוני פשוט לבדיקות רשת
export const Connection = {
  // בדיקת חיבור לאינטרנט
  isOnline: async (): Promise<boolean> => await NetworkUtils.isNetworkAvailable(),

  // מתי היה חיבור בפעם האחרונה
  lastOnline: async (): Promise<Date | null> => await NetworkUtils.getLastOnlineTime(),

  // האם החיבור האחרון ישן
  isStale: async (minutes: number = 60): Promise<boolean> => await NetworkUtils.isStale(minutes),

  // הרשמה לעדכוני חיבור
  subscribe: (callback: (isOnline: boolean, state: NetInfoState) => void): (() => void) =>
    NetworkUtils.subscribeToNetworkChanges(callback),

  // ביטול כל ההרשמות לעדכוני חיבור
  unsubscribeAll: (): void => NetworkUtils.unsubscribeAll(),

  // האם האפליקציה הייתה מחוברת אי פעם
  hasEverBeenOnline: async (): Promise<boolean> => await NetworkUtils.hasEverBeenOnline(),

  // סימון ידני שהאפליקציה מחוברת כעת
  markAsOnline: async (): Promise<void> => await NetworkUtils.markAsOnline(),
};
