import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {useGetTodayEventsQuery, useRefreshHebcalDataMutation} from '../data/redux/api/hebcalApi';
import {useGetOmerDataQuery, useRefreshOmerDataMutation} from '../data/redux/api/omerApi';
import {useGetParashaDataQuery, useRefreshParashaDataMutation} from '../data/redux/api/parashaApi';
import {useGetZmanimDataQuery, useRefreshZmanimDataMutation} from '../data/redux/api/zmanimApi';
import {useTheme} from '../utilities/ThemeManager';

// הגדרת מאפייני Props של הרכיב
interface ZmanimProps {
  displayLimit?: number; // מספר זמנים מקסימלי להצגה
  showHeader?: boolean; // האם להציג כותרת וזמנים
}

const REFRESH_INTERVAL = 60000; // רענון כל דקה

// קטגוריות הזמנים
type TimeCategory = 'בוקר' | 'צהריים' | 'ערב';

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
  // סגנונות חדשים ללוח זמנים
  timetableContainer: ViewStyle;
  timetableHeader: ViewStyle;
  timetableHeaderText: TextStyle;
  categoryContainer: ViewStyle;
  categoryHeader: ViewStyle;
  categoryHeaderText: TextStyle;
  timeItemContainer: ViewStyle;
  dayPartIndicator: TextStyle;
  dayPartText: TextStyle;
  tableHeader: ViewStyle;
  tableHeaderText: TextStyle;
  tableRow: ViewStyle;
  tableNameCell: ViewStyle;
  tableTimeCell: ViewStyle;
  tableNameText: TextStyle;
  tableTimeText: TextStyle;
  currentTimeIndicator: ViewStyle;
  nearTimeContainer: ViewStyle;
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
      opacity: 0.65,
    },
    pastTimeText: {
      color: colors.text.disabled,
    },
    nextTime: {
      backgroundColor: colors.notification.success + '30',
      borderRadius: 8,
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
    // סגנונות חדשים ללוח זמנים
    timetableContainer: {
      backgroundColor: colors.card.background,
      borderRadius: 8,
      marginVertical: 8,
      overflow: 'hidden',
      elevation: 1,
    },
    timetableHeader: {
      backgroundColor: colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    timetableHeaderText: {
      color: colors.text.inverse,
      fontWeight: 'bold',
      fontSize: 18,
      textAlign: 'center',
    },
    categoryContainer: {
      marginBottom: 16,
      backgroundColor: colors.card.background,
      borderRadius: 8,
      overflow: 'hidden',
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary + '20',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    categoryHeaderText: {
      fontSize: 17,
      fontWeight: 'bold',
      color: colors.primary,
      textAlign: 'center',
      flex: 1,
    },
    timeItemContainer: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.divider,
    },
    dayPartIndicator: {
      fontSize: 20,
      marginRight: 10,
    },
    dayPartText: {
      fontSize: 16,
      color: colors.text.primary,
      fontWeight: 'bold',
    },
    tableHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.divider,
    },
    tableHeaderText: {
      fontSize: 15,
      fontWeight: 'bold',
      color: colors.text.secondary,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.divider,
    },
    tableNameCell: {
      flex: 1,
      justifyContent: 'center',
    },
    tableTimeCell: {
      width: 80,
      alignItems: 'flex-start',
      justifyContent: 'center',
      position: 'relative',
    },
    tableNameText: {
      fontSize: 16,
      color: colors.text.primary,
      textAlign: 'right',
    },
    tableTimeText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.primary,
    },
    currentTimeIndicator: {
      position: 'absolute',
      right: -12,
      top: '50%',
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.success,
      marginTop: -5,
    },
    nearTimeContainer: {
      backgroundColor: colors.notification.info + '20',
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
    },
  });

  // עדכון השעה הנוכחית כל דקה
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, REFRESH_INTERVAL);

    return () => clearInterval(timer);
  }, []);

  // הצגת נתונים שהתקבלו במסוף
  useEffect(() => {
    if (zmanimData) {
      console.log('📅 נתוני זמנים התקבלו:', {
        hebrewDate: zmanimData.hebrewDate,
        zmanItems: zmanimData.zmanim.length,
        isShabbat: zmanimData.isShabbat ? 'כן' : 'לא',
        parasha: zmanimData.parasha || 'אין',
      });
    }

    if (detailedZmanimData) {
      console.log('⏰ נתוני זמנים מפורטים התקבלו:', {
        count: detailedZmanimData.items?.length || 0,
        sunrise:
          detailedZmanimData.items?.find(z => z.title === 'עלות השחר')?.timeString || 'לא זמין',
        sunset:
          detailedZmanimData.items?.find(z => z.title === 'שקיעת החמה')?.timeString || 'לא זמין',
      });
    }

    if (parashaData) {
      console.log('📖 נתוני פרשת השבוע התקבלו:', {
        name: parashaData.hebrew.parashaName || parashaData.parashaName,
        date: parashaData.date,
      });
    }

    if (omerData) {
      console.log('🌾 נתוני ספירת העומר התקבלו:', {
        count: omerData.todayOmer?.hebrew?.substring(0, 30),
        isOmer: omerData.isOmerPeriod ? 'כן' : 'לא',
        text: omerData.todayOmer?.hebrew?.substring(0, 30),
      });
    }
  }, [zmanimData, detailedZmanimData, parashaData, omerData]);

  // הוספת פונקציית עזר להמרה בטוחה של אובייקטים למחרוזות
  const safeStringify = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  };

  // ביצוע רענון הנתונים ורפטש
  const handleRefresh = async () => {
    try {
      console.log('🔄 מתחיל רענון נתוני זמנים...');
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
      console.log('✅ רענון נתוני זמנים הושלם בהצלחה');
    } catch (err) {
      console.error('❌ שגיאה ברענון נתוני זמנים:', safeStringify(err));
    }
  };

  // הזמן המפורט הבא (מה-API החדש)
  const nextDetailedTime = useMemo(() => {
    if (!detailedZmanimData?.items || detailedZmanimData.items.length === 0) {
      return null;
    }

    // נקבל רק את הזמנים העתידיים
    const futureZmanim = detailedZmanimData.items.filter(z => {
      return z.time && new Date(z.time) > currentTime;
    });

    // אם אין זמנים עתידיים
    if (futureZmanim.length === 0) {
      return null;
    }

    // נמצא את הזמן הקרוב ביותר
    return futureZmanim.reduce((closest, current) => {
      const currentItemTime = new Date(current.time).getTime();
      const closestTime = new Date(closest.time).getTime();
      return currentItemTime < closestTime ? current : closest;
    }, futureZmanim[0]);
  }, [detailedZmanimData?.items, currentTime]);

  // חלוקת זמנים לקטגוריות - חדש
  const categorizedTimes = useMemo(() => {
    if (!detailedZmanimData?.items || detailedZmanimData.items.length === 0) {
      return {
        morning: [],
        noon: [],
        evening: [],
      };
    }

    return detailedZmanimData.items.reduce(
      (acc, item) => {
        try {
          if (!item.time) {
            return acc;
          }

          const timeDate = new Date(item.time);
          const hours = timeDate.getHours();

          if (hours < 12) {
            acc.morning.push(item);
          } else if (hours < 17) {
            acc.noon.push(item);
          } else {
            acc.evening.push(item);
          }
        } catch (e) {
          console.error('שגיאה במיון זמנים:', e);
        }
        return acc;
      },
      {morning: [], noon: [], evening: []} as Record<string, any[]>,
    );
  }, [detailedZmanimData?.items]);

  // פונקציה להצגת קטגוריית זמנים
  const renderTimeCategory = useCallback(
    (title: TimeCategory, items: any[], icon: string) => {
      if (!items || items.length === 0) {
        return null;
      }

      return (
        <View style={dynamicStyles.categoryContainer}>
          <View style={dynamicStyles.categoryHeader}>
            <Text style={dynamicStyles.dayPartIndicator}>{icon}</Text>
            <Text style={dynamicStyles.categoryHeaderText}>{title}</Text>
          </View>

          <View style={dynamicStyles.tableHeader}>
            <Text style={[dynamicStyles.tableHeaderText, {flex: 1, textAlign: 'right'}]}>זמן</Text>
            <Text style={[dynamicStyles.tableHeaderText, {width: 80, textAlign: 'left'}]}>שעה</Text>
          </View>

          {items.map((item, index) => {
            const itemTime = new Date(item.time);
            const isPast = itemTime < currentTime;
            const isNext = nextDetailedTime?.title === item.title;

            return (
              <View
                key={index}
                style={[
                  dynamicStyles.tableRow,
                  isPast && dynamicStyles.pastTime,
                  isNext && dynamicStyles.nextTime,
                ]}>
                <View style={dynamicStyles.tableNameCell}>
                  <Text
                    style={[
                      dynamicStyles.tableNameText,
                      isPast && dynamicStyles.pastTimeText,
                      isNext && dynamicStyles.highlightedText,
                    ]}>
                    {item.title}
                  </Text>
                </View>
                <View style={dynamicStyles.tableTimeCell}>
                  <Text
                    style={[
                      dynamicStyles.tableTimeText,
                      isPast && dynamicStyles.pastTimeText,
                      isNext && dynamicStyles.highlightedText,
                    ]}>
                    {item.timeString}
                  </Text>
                  {isNext && <View style={dynamicStyles.currentTimeIndicator} />}
                </View>
              </View>
            );
          })}
        </View>
      );
    },
    [currentTime, nextDetailedTime, dynamicStyles],
  );

  // Define date strings
  const dateString = currentTime.toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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

      {/* הצגת הזמן הבא הקרוב */}
      {nextDetailedTime && (
        <View style={dynamicStyles.nearTimeContainer}>
          <Text style={dynamicStyles.nextTimeText}>
            <Text style={{fontWeight: 'bold'}}>הזמן הקרוב: </Text>
            {nextDetailedTime.title} - {nextDetailedTime.timeString}
          </Text>
        </View>
      )}

      {/* הצגת מידע על פרשת השבוע וההפטרה */}
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

      {/* הצגת מידע ספירת העומר */}
      {omerData?.todayOmer && (
        <View style={dynamicStyles.omerContainer}>
          <Text style={dynamicStyles.omerTitle}>ספירת העומר</Text>
          <Text style={dynamicStyles.omerText}>{omerData.todayOmer.hebrew}</Text>
          <Text style={dynamicStyles.omerFullText}>{omerData.todayOmer.fullOmerText}</Text>
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

      <ScrollView style={{maxHeight: 400}}>
        {/* לוח הזמנים החדש */}
        <View style={dynamicStyles.timetableContainer}>
          <View style={dynamicStyles.timetableHeader}>
            <Text style={dynamicStyles.timetableHeaderText}>לוח זמני היום</Text>
          </View>

          {/* זמני בוקר */}
          {renderTimeCategory('בוקר', categorizedTimes.morning, '🌅')}

          {/* זמני צהריים */}
          {renderTimeCategory('צהריים', categorizedTimes.noon, '☀️')}

          {/* זמני ערב */}
          {renderTimeCategory('ערב', categorizedTimes.evening, '🌙')}
        </View>
      </ScrollView>

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
