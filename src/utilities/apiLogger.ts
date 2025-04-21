import {isRejectedWithValue, Middleware} from '@reduxjs/toolkit';

/**
 * מידלוור המציג לוגים של קריאות API וערכים שהתקבלו בצורה מפורטת
 */
export const apiLogger: Middleware = () => next => action => {
  // רק פעולות מסוג RTK Query
  const isApiAction = action.type?.startsWith('api/');

  if (isApiAction) {
    const [apiPrefix, actionType, endpoint] = action.type.split('/');
    const timestamp = new Date().toISOString();

    // מציג לוג לכל פעולת API
    console.group(`🔄 API קריאת [${endpoint}] - ${actionType} (${timestamp})`);
    console.log(`סוג פעולה: ${action.type}`);

    // הצגת מידע על הבקשה (אם קיים)
    if (action.meta?.arg?.originalArgs) {
      const requestParams =
        typeof action.meta.arg.originalArgs === 'object'
          ? JSON.stringify(action.meta.arg.originalArgs, null, 2)
          : action.meta.arg.originalArgs;
      console.log('פרמטרים לבקשה:', requestParams);
    }

    // מציג לוג של ערכי תשובה מוצלחים
    if (action.payload && !action.error) {
      // המרה מפורשת לJSON כדי להימנע מהצגת [object Object]
      const formattedPayload =
        typeof action.payload === 'object'
          ? JSON.stringify(action.payload, null, 2)
          : action.payload;
      console.log(`📡 תשובה מוצלחת:`, formattedPayload);

      // הצגת מבנה התשובה אם מדובר באובייקט
      if (typeof action.payload === 'object' && action.payload !== null) {
        console.log('מבנה התשובה:', Object.keys(action.payload));

        // הצגת מספר פריטים אם מדובר במערך
        if (Array.isArray(action.payload)) {
          console.log(`מספר פריטים: ${action.payload.length}`);
        }
      }
    }

    // מציג לוג של שגיאות API
    if (isRejectedWithValue(action) || action.error) {
      // המרה מפורשת לJSON של אובייקט השגיאה
      const errorPayload = action.payload || action.error;
      const formattedError =
        typeof errorPayload === 'object' ? JSON.stringify(errorPayload, null, 2) : errorPayload;
      console.error(`❌ שגיאה:`, formattedError);

      // הצגת קוד השגיאה ומידע נוסף אם קיים
      if (typeof errorPayload === 'object' && errorPayload !== null) {
        if (errorPayload.status) console.error(`קוד שגיאה: ${errorPayload.status}`);
        if (errorPayload.message) console.error(`הודעת שגיאה: ${errorPayload.message}`);
        if (errorPayload.stack) console.error(`מקור שגיאה: ${errorPayload.stack}`);
      }
    }

    // הצגת מידע מטא אם קיים
    if (action.meta) {
      console.log('מידע נוסף:', {
        requestId: action.meta.requestId,
        requestStatus: action.meta.requestStatus,
        duration: action.meta.baseQueryMeta?.duration || 'לא זמין',
      });
    }

    console.groupEnd();
  }

  return next(action);
};
