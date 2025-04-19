import React, {useEffect, useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {
  useGetTodayEventsQuery,
  useRefreshHebcalDataMutation,
  ZmanItem,
} from '../data/redux/api/hebcalApi';
import {useGetOmerDataQuery, useRefreshOmerDataMutation} from '../data/redux/api/omerApi';
import {useGetParashaDataQuery, useRefreshParashaDataMutation} from '../data/redux/api/parashaApi';
import {useGetZmanimDataQuery, useRefreshZmanimDataMutation} from '../data/redux/api/zmanimApi';
import {useTheme} from '../utilities/ThemeManager';
import {formatTimeForDisplay} from '../utilities/timeUtils';

// הגדרת מאפייני Props של הרכיב
interface ZmanimProps {
  displayLimit?: number; // מספר זמנים מקסימלי להצגה
  showHeader?: boolean; // האם להציג כותרת וזמנים
}

const REFRESH_INTERVAL = 60000; // רענון כל דקה

// Define a type for the dynamic styles object
type DynamicStyles = {
  container: ViewStyle;
  title: TextStyle;
  dateText: TextStyle;
  hebrewDateText: TextStyle;
  shabbatBadge: ViewStyle;
  shabbatText: TextStyle;
  eventsContainer: ViewStyle;
  eventText: TextStyle;
  specialEventText: TextStyle;
  nextTimeContainer: ViewStyle;
  nextTimeLabel: TextStyle;
  nextTimeText: TextStyle;
  zmanimList: ViewStyle;
  zmanimRow: ViewStyle;
  zmanimName: TextStyle;
  zmanimTime: TextStyle;
  noDataContainer: ViewStyle;
  noDataText: TextStyle;
  pastTime: ViewStyle;
  pastTimeText: TextStyle;
  nextTime: ViewStyle;
  highlightedText: TextStyle;
  methodText: TextStyle;
  headerContainer: ViewStyle;
  parashaContainer: ViewStyle;
  parashaText: TextStyle;
  haftarahText: TextStyle;
  parashaTitle: TextStyle;
  refreshButton: ViewStyle;
  refreshText: TextStyle;
  divider: ViewStyle;
  locationContainer: ViewStyle;
  locationText: TextStyle;
  sectionHeader: TextStyle;
  sectionContainer: ViewStyle;
  omerContainer: ViewStyle;
  omerTitle: TextStyle;
  omerText: TextStyle;
  omerFullText: TextStyle;
};

const Zmanim: React.FC<ZmanimProps> = ({displayLimit, showHeader = true}) => {
  const {colors} = useTheme();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // שימוש ב-RTK Query לקבלת הנתונים
  const {
    data: zmanimData,
    isLoading: isZmanimLoading,
    isFetching: isZmanimFetching,
    error: zmanimError,
    refetch: refetchZmanim,
  } = useGetTodayEventsQuery();

  // שימוש ב-ZmanimAPI החדש
  const {
    data: detailedZmanimData,
    isLoading: isDetailedZmanimLoading,
    error: detailedZmanimError,
    refetch: refetchDetailedZmanim,
  } = useGetZmanimDataQuery();

  const {
    data: parashaData,
    isLoading: isParashaLoading,
    error: parashaError,
    refetch: refetchParasha,
  } = useGetParashaDataQuery();

  // שימוש ב-OmerAPI החדש שיצרנו
  const {
    data: omerData,
    isLoading: isOmerLoading,
    error: omerError,
    refetch: refetchOmer,
  } = useGetOmerDataQuery();

  // Mutation לרענון נתונים מהשרת
  const [refreshZmanimData, {isLoading: isRefreshingZmanim}] = useRefreshHebcalDataMutation();
  const [refreshDetailedZmanimData, {isLoading: isRefreshingDetailedZmanim}] =
    useRefreshZmanimDataMutation();
  const [refreshParashaData, {isLoading: isRefreshingParasha}] = useRefreshParashaDataMutation();
  const [refreshOmerData, {isLoading: isRefreshingOmer}] = useRefreshOmerDataMutation();

  const isLoading = isZmanimLoading || isParashaLoading || isDetailedZmanimLoading || isOmerLoading;
  const isFetching = isZmanimFetching;
  const isRefreshing =
    isRefreshingZmanim || isRefreshingParasha || isRefreshingDetailedZmanim || isRefreshingOmer;
  const error = zmanimError || parashaError || detailedZmanimError || omerError;

  // עדכון השעה הנוכחית כל דקה
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, REFRESH_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  // ביצוע רענון הנתונים ורפטש
  const handleRefresh = async () => {
    try {
      // קודם נבצע רענון הנתונים בשירות (מחיקת קאש)
      await Promise.all([
        refreshZmanimData(),
        refreshParashaData(),
        refreshDetailedZmanimData(),
        refreshOmerData(),
      ]);

      // אחרי זה נבקש מ-RTK Query לבצע fetching מחדש של הנתונים
      await Promise.all([
        refetchZmanim(),
        refetchParasha(),
        refetchDetailedZmanim(),
        refetchOmer(),
      ]);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  // הזמן הקרוב הבא (מ-hebcalAPI)
  const nextTime = useMemo<ZmanItem | null>(() => {
    if (!zmanimData?.zmanim || zmanimData.zmanim.length === 0) {
      return null;
    }

    // נקבל רק את הזמנים העתידיים (שעוד לא עברו)
    const futureZmanim = zmanimData.zmanim.filter(z => {
      // Convert ISO string to Date for comparison
      return z.parsedTime && new Date(z.parsedTime) > currentTime;
    });

    // אם אין זמנים עתידיים היום, נחזיר null
    if (futureZmanim.length === 0) {
      return null;
    }

    // נמצא את הזמן הקרוב ביותר
    return futureZmanim.reduce((closest, current) => {
      // Make sure both parsed times exist before comparing
      if (current.parsedTime && closest.parsedTime) {
        const currentTime = new Date(current.parsedTime).getTime();
        const closestTime = new Date(closest.parsedTime).getTime();
        return currentTime < closestTime ? current : closest;
      }
      // If closest doesn't have parsedTime but current does, return current
      if (current.parsedTime && !closest.parsedTime) {
        return current;
      }
      // Default: keep closest
      return closest;
    }, futureZmanim[0]);
  }, [zmanimData?.zmanim, currentTime]);

  // הזמן המפורט הבא (מה-API החדש)
  const nextDetailedTime = useMemo(() => {
    if (!detailedZmanimData?.items || detailedZmanimData.items.length === 0) {
      return null;
    }

    // נקבל רק את הזמנים העתידיים
    const futureZmanim = detailedZmanimData.items.filter(z => {
      return z.time && z.time > currentTime;
    });

    // אם אין זמנים עתידיים
    if (futureZmanim.length === 0) {
      return null;
    }

    // נמצא את הזמן הקרוב ביותר
    return futureZmanim.reduce((closest, current) => {
      return current.time.getTime() < closest.time.getTime() ? current : closest;
    }, futureZmanim[0]);
  }, [detailedZmanimData?.items, currentTime]);

  // Define date strings
  const dateString = currentTime.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // יצירת סגנונות דינמיים בהתאם לנושא הנוכחי
  const dynamicStyles = StyleSheet.create<DynamicStyles>({
    container: {
      backgroundColor: colors.card.background,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.2,
      shadowRadius: 1.5,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.primary,
      textAlign: 'right',
    },
    dateText: {
      fontSize: 16,
      color: colors.text.secondary,
      marginBottom: 2,
      textAlign: 'right',
    },
    hebrewDateText: {
      fontSize: 16,
      color: colors.text.primary,
      fontWeight: '500',
      textAlign: 'right',
    },
    shabbatBadge: {
      backgroundColor: colors.secondary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    shabbatText: {
      color: colors.text.inverse,
      fontWeight: 'bold',
      fontSize: 14,
    },
    eventsContainer: {
      backgroundColor: colors.surface,
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
    },
    eventText: {
      fontSize: 14,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: 2,
    },
    specialEventText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 4,
    },
    nextTimeContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: colors.notification.info,
      padding: 8,
      borderRadius: 8,
      marginBottom: 12,
    },
    nextTimeLabel: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.accent,
      marginEnd: 8,
    },
    nextTimeText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '500',
    },
    zmanimList: {
      maxHeight: 300,
    },
    zmanimRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    zmanimName: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text.primary,
      textAlign: 'right',
    },
    zmanimTime: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: 'bold',
    },
    noDataContainer: {
      padding: 16,
      alignItems: 'center',
    },
    noDataText: {
      fontSize: 16,
      color: colors.text.secondary,
      fontStyle: 'italic',
    },
    pastTime: {
      opacity: 0.5,
    },
    pastTimeText: {
      color: colors.text.disabled,
    },
    nextTime: {
      backgroundColor: colors.notification.success,
      borderRadius: 8,
      paddingHorizontal: 8,
    },
    highlightedText: {
      color: colors.success,
      fontWeight: 'bold',
    },
    methodText: {
      fontSize: 12,
      color: colors.text.secondary,
      textAlign: 'right',
      marginTop: 2,
    },
    headerContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    parashaContainer: {
      backgroundColor: colors.secondary + '30', // Adding transparency
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
    },
    parashaTitle: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 6,
    },
    parashaText: {
      fontSize: 18,
      color: colors.text.primary,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    haftarahText: {
      fontSize: 16,
      color: colors.text.primary,
      textAlign: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginVertical: 6,
    },
    refreshButton: {
      // כפתור לרענון הנתונים
      backgroundColor: colors.primary + '20',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 16,
      alignSelf: 'center',
      marginTop: 8,
    },
    refreshText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    locationContainer: {
      backgroundColor: colors.surface + '80',
      padding: 8,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 8,
    },
    locationText: {
      fontSize: 14,
      color: colors.text.primary,
    },
    sectionHeader: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'right',
      marginVertical: 8,
    },
    sectionContainer: {
      backgroundColor: colors.surface + '50',
      borderRadius: 8,
      padding: 8,
      marginBottom: 12,
    },
    // סגנונות חדשים לספירת העומר
    omerContainer: {
      backgroundColor: colors.primary + '20',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      alignItems: 'center',
    },
    omerTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: 4,
    },
    omerText: {
      fontSize: 16,
      color: colors.text.primary,
      textAlign: 'center',
      marginBottom: 4,
    },
    omerFullText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.success,
      textAlign: 'center',
      marginTop: 4,
    },
  });

  // אם אין נתונים להצגה או שעדיין טוענים
  if (isLoading || (!zmanimData && !parashaData && !detailedZmanimData && !omerData && !error)) {
    return (
      <View style={dynamicStyles.container}>
        {showHeader && (
          <View style={dynamicStyles.headerContainer}>
            <View>
              <Text style={dynamicStyles.title}>זמני היום</Text>
            </View>
          </View>
        )}
        <View style={dynamicStyles.noDataContainer}>
          <Text style={dynamicStyles.noDataText}>טוען זמנים...</Text>
        </View>
      </View>
    );
  }

  // במידה ויש שגיאה בטעינת הנתונים
  if (error) {
    return (
      <View style={dynamicStyles.container}>
        {showHeader && (
          <View style={dynamicStyles.headerContainer}>
            <View>
              <Text style={dynamicStyles.title}>זמני היום</Text>
              <Text style={dynamicStyles.dateText}>{dateString}</Text>
            </View>
          </View>
        )}
        <View style={dynamicStyles.noDataContainer}>
          <Text style={dynamicStyles.noDataText}>שגיאה בטעינת הנתונים</Text>
          <TouchableOpacity
            style={dynamicStyles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}>
            <Text style={dynamicStyles.refreshText}>{isRefreshing ? 'מרענן...' : 'נסה שנית'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (
    (!zmanimData?.zmanim || zmanimData.zmanim.length === 0) &&
    (!detailedZmanimData?.items || detailedZmanimData.items.length === 0)
  ) {
    return (
      <View style={dynamicStyles.container}>
        {showHeader && (
          <View style={dynamicStyles.headerContainer}>
            <View>
              <Text style={dynamicStyles.title}>זמני היום</Text>
              <Text style={dynamicStyles.dateText}>{dateString}</Text>
              {zmanimData?.hebrewDate && (
                <Text style={dynamicStyles.hebrewDateText}>{zmanimData.hebrewDate}</Text>
              )}
            </View>
            {zmanimData?.isShabbat && (
              <View style={dynamicStyles.shabbatBadge}>
                <Text style={dynamicStyles.shabbatText}>שבת שלום</Text>
              </View>
            )}
          </View>
        )}
        <View style={dynamicStyles.noDataContainer}>
          <Text style={dynamicStyles.noDataText}>אין נתוני זמנים להצגה</Text>
          <TouchableOpacity
            style={dynamicStyles.refreshButton}
            onPress={handleRefresh}
            disabled={isRefreshing}>
            <Text style={dynamicStyles.refreshText}>
              {isRefreshing ? 'מרענן...' : 'רענן נתונים'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // אם יש מגבלת הצגה, קטע את הרשימה
  const displayZmanim =
    displayLimit && zmanimData?.zmanim
      ? zmanimData.zmanim.slice(0, displayLimit)
      : zmanimData?.zmanim || [];

  // אם יש מגבלת הצגה, קטע את הרשימה גם עבור הזמנים המפורטים
  const displayDetailedZmanim =
    displayLimit && detailedZmanimData?.items
      ? detailedZmanimData.items.slice(0, displayLimit)
      : detailedZmanimData?.items || [];

  // קבץ אירועים לפי קטגוריה להצגה נוחה
  const holidayEvents =
    zmanimData?.hebrewEvents?.filter(
      event =>
        event.category === 'holiday' ||
        event.category === 'mevarchim' ||
        event.category === 'roshchodesh',
    ) || [];

  return (
    <View style={dynamicStyles.container}>
      {showHeader && (
        <View style={dynamicStyles.headerContainer}>
          <View>
            <Text style={dynamicStyles.title}>זמני היום</Text>
            <Text style={dynamicStyles.dateText}>{dateString}</Text>
            {zmanimData?.hebrewDate && (
              <Text style={dynamicStyles.hebrewDateText}>{zmanimData.hebrewDate}</Text>
            )}
            <Text style={dynamicStyles.methodText}>מבוסס על נתוני לוח hebcal</Text>
          </View>

          {zmanimData?.isShabbat && (
            <View style={dynamicStyles.shabbatBadge}>
              <Text style={dynamicStyles.shabbatText}>שבת שלום</Text>
            </View>
          )}
        </View>
      )}

      {/* הצגת פרטי המיקום */}
      {detailedZmanimData?.location && (
        <View style={dynamicStyles.locationContainer}>
          <Text style={dynamicStyles.locationText}>
            {detailedZmanimData.location.name} ({detailedZmanimData.location.latitude.toFixed(2)},{' '}
            {detailedZmanimData.location.longitude.toFixed(2)})
          </Text>
        </View>
      )}

      {/* הצגת מידע ספירת העומר */}
      {omerData?.todayOmer && (
        <View style={dynamicStyles.omerContainer}>
          <Text style={dynamicStyles.omerTitle}>ספירת העומר</Text>
          <Text style={dynamicStyles.omerText}>{omerData.todayOmer.hebrew}</Text>
          <Text style={dynamicStyles.omerFullText}>{omerData.todayOmer.fullOmerText}</Text>
        </View>
      )}

      {/* הצגת מידע על העומר הבא אם אנחנו בתקופת העומר אבל אין ספירה היום */}
      {!omerData?.todayOmer && omerData?.nextOmer && omerData?.isOmerPeriod && (
        <View style={dynamicStyles.omerContainer}>
          <Text style={dynamicStyles.omerTitle}>ספירת העומר</Text>
          <Text style={dynamicStyles.omerText}>ספירת העומר הבאה:</Text>
          <Text style={dynamicStyles.omerText}>
            {new Date(omerData.nextOmer.date).toLocaleDateString('he-IL')}
          </Text>
          <Text style={dynamicStyles.omerFullText}>{omerData.nextOmer.hebrew}</Text>
        </View>
      )}

      {/* הוספת מידע על פרשת השבוע וההפטרה */}
      {parashaData && (
        <View style={dynamicStyles.parashaContainer}>
          <Text style={dynamicStyles.parashaTitle}>פרשת השבוע</Text>
          <Text style={dynamicStyles.parashaText}>{parashaData.hebrew.parashaName}</Text>
          {parashaData.hebrew.haftarahName && (
            <>
              <View style={dynamicStyles.divider} />
              <Text style={dynamicStyles.parashaTitle}>הפטרה</Text>
              <Text style={dynamicStyles.haftarahText}>{parashaData.hebrew.haftarahName}</Text>
            </>
          )}
        </View>
      )}

      {/* תצוגת פרשה מה-API של hebcal (גיבוי) */}
      {!parashaData && zmanimData?.parasha && (
        <View style={dynamicStyles.parashaContainer}>
          <Text style={dynamicStyles.parashaTitle}>פרשת השבוע</Text>
          <Text style={dynamicStyles.parashaText}>{zmanimData.parasha}</Text>
        </View>
      )}

      {holidayEvents.length > 0 && (
        <View style={dynamicStyles.eventsContainer}>
          {holidayEvents.map((event, index) => (
            <Text
              key={index}
              style={
                event.category === 'holiday'
                  ? dynamicStyles.specialEventText
                  : dynamicStyles.eventText
              }>
              {event.hebrew || event.title}
            </Text>
          ))}
        </View>
      )}

      {/* הצגת הזמן הבא מהזמנים המפורטים */}
      {nextDetailedTime && (
        <View style={dynamicStyles.nextTimeContainer}>
          <Text style={dynamicStyles.nextTimeLabel}>הזמן הקרוב:</Text>
          <Text style={dynamicStyles.nextTimeText}>
            {nextDetailedTime.title} - {nextDetailedTime.timeString}
          </Text>
        </View>
      )}

      {/* אם אין זמן קרוב מהזמנים המפורטים אבל יש מהזמנים הרגילים */}
      {!nextDetailedTime && nextTime && (
        <View style={dynamicStyles.nextTimeContainer}>
          <Text style={dynamicStyles.nextTimeLabel}>הזמן הקרוב:</Text>
          <Text style={dynamicStyles.nextTimeText}>
            {nextTime.name} -{' '}
            {formatTimeForDisplay(nextTime.parsedTime ? new Date(nextTime.parsedTime) : null)}
          </Text>
        </View>
      )}

      {/* הצגת הזמנים המפורטים מה-API החדש */}
      {detailedZmanimData?.items && detailedZmanimData.items.length > 0 && (
        <View style={dynamicStyles.sectionContainer}>
          <Text style={dynamicStyles.sectionHeader}>זמני היום המפורטים</Text>
          <ScrollView style={dynamicStyles.zmanimList} horizontal={false}>
            {displayDetailedZmanim.map((item, index) => {
              const isPast = item.time && item.time < currentTime;
              const isNext = nextDetailedTime?.title === item.title;

              return (
                <View
                  key={index}
                  style={[
                    dynamicStyles.zmanimRow,
                    isPast && dynamicStyles.pastTime,
                    isNext && dynamicStyles.nextTime,
                  ]}>
                  <Text
                    style={[
                      dynamicStyles.zmanimName,
                      isPast && dynamicStyles.pastTimeText,
                      isNext && dynamicStyles.highlightedText,
                    ]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      dynamicStyles.zmanimTime,
                      isPast && dynamicStyles.pastTimeText,
                      isNext && dynamicStyles.highlightedText,
                    ]}>
                    {item.timeString}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* הצגת הזמנים הרגילים מה-API הקיים */}
      {zmanimData?.zmanim && zmanimData.zmanim.length > 0 && (
        <ScrollView style={dynamicStyles.zmanimList} horizontal={false}>
          {displayZmanim.map((item, index) => {
            // Convert ISO string to Date for comparison
            const isPast = item.parsedTime && new Date(item.parsedTime) < currentTime;
            const isNext = nextTime?.name === item.name;

            // Use formatted time
            const displayTime = formatTimeForDisplay(
              item.parsedTime ? new Date(item.parsedTime) : null,
            );

            return (
              <View
                key={index}
                style={[
                  dynamicStyles.zmanimRow,
                  isPast && dynamicStyles.pastTime,
                  isNext && dynamicStyles.nextTime,
                ]}>
                <Text
                  style={[
                    dynamicStyles.zmanimName,
                    isPast && dynamicStyles.pastTimeText,
                    isNext && dynamicStyles.highlightedText,
                  ]}>
                  {item.name}
                </Text>
                <Text
                  style={[
                    dynamicStyles.zmanimTime,
                    isPast && dynamicStyles.pastTimeText,
                    isNext && dynamicStyles.highlightedText,
                  ]}>
                  {displayTime}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* כפתור רענון */}
      <TouchableOpacity
        style={dynamicStyles.refreshButton}
        onPress={handleRefresh}
        disabled={isRefreshing || isFetching}>
        <Text style={dynamicStyles.refreshText}>
          {isRefreshing || isFetching ? 'מרענן...' : 'רענן נתונים'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Zmanim;
