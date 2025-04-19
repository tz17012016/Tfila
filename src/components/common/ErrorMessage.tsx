import React, {useEffect, useState} from 'react';
import {Alert, Linking, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Connection} from '../../utilities/NetworkUtills';
import {useTheme} from '../../utilities/ThemeManager';

interface ErrorMessageProps {
  error: unknown;
  retry?: () => void;
  showDetails?: boolean;
  showNetworkCheck?: boolean;
  retryCount?: number;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  retry,
  showDetails = __DEV__,
  showNetworkCheck = false,
  retryCount = 0,
}) => {
  const {colors} = useTheme();
  const [lastOnline, setLastOnline] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);

  useEffect(() => {
    async function checkConnection(): Promise<void> {
      try {
        const lastOnlineTime = await Connection.lastOnline();
        setLastOnline(lastOnlineTime);

        if (lastOnlineTime) {
          const now = new Date();
          const diffHours = (now.getTime() - lastOnlineTime.getTime()) / (1000 * 60 * 60);
          setIsStale(diffHours > 24);
        }
      } catch (e) {
        console.error('Failed to check last online time:', e);
      }
    }

    if (showNetworkCheck) {
      checkConnection();
    }
  }, [showNetworkCheck]);

  const handleContactSupport = (): void => {
    const supportEmail = 'support@tfila-app.com';
    const subject = encodeURIComponent('דיווח על שגיאה באפליקציה');

    let errorMessage: string;
    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error instanceof Error) {
      try {
        // Safely access error.stack
        const stack = error.stack || '';
        errorMessage = `${error.name}: ${error.message}\n${stack}`;
      } catch (e) {
        errorMessage = `${error.name}: ${error.message}\n[Stack trace unavailable]`;
      }
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch (e) {
        errorMessage = String(error);
      }
    }

    const body = encodeURIComponent(
      `פרטי השגיאה:\n${errorMessage}\n\nמכשיר: ${Platform.OS} ${Platform.Version}\n`,
    );

    const mailtoUrl = `mailto:${supportEmail}?subject=${subject}&body=${body}`;

    Linking.canOpenURL(mailtoUrl)
      .then(supported => {
        if (supported) {
          return Linking.openURL(mailtoUrl);
        } else {
          Alert.alert('שגיאה', 'לא ניתן לפתוח אפליקציית אימייל');
        }
      })
      .catch(err => {
        Alert.alert('שגיאה', 'לא ניתן לפתוח אפליקציית אימייל');
        console.error('Failed to open email app:', err);
      });
  };

  const renderLastOnlineInfo = () => {
    if (!lastOnline) return null;

    const formattedDate = lastOnline.toLocaleString('he-IL', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    return (
      <View style={styles.lastOnlineContainer}>
        <Text style={[styles.lastOnlineText, {color: colors.text.secondary}]}>
          {isStale ? 'חיבור אחרון לפני יותר מ-24 שעות' : `חיבור אחרון: ${formattedDate}`}
        </Text>
      </View>
    );
  };

  // יצירת מחרוזת שגיאה להצגה
  const errorMessage = (): string => {
    if (typeof error === 'string') {
      return error;
    } else if (error instanceof Error) {
      return error.message;
    } else {
      return 'אירעה שגיאה. אנא נסה שוב מאוחר יותר.';
    }
  };

  // עיבוד פרטי שגיאה להצגה למפתחים
  const errorDetails = (): string => {
    if (error instanceof Error) {
      let stack = '';
      try {
        stack = error.stack || 'Not available';
      } catch (e) {
        stack = '[Stack trace unavailable]';
      }
      return `${error.name}: ${error.message}\nStack: ${stack}`;
    } else {
      try {
        const jsonString = JSON.stringify(error, null, 2);
        return jsonString !== undefined ? jsonString : String(error);
      } catch (e) {
        console.error('Failed to stringify error', e);
        return String(error);
      }
    }
  };

  const dynamicStyles = {
    container: {
      backgroundColor: colors.card.background,
      borderLeftColor: colors.error,
      borderLeftWidth: 4,
    },
    title: {
      color: colors.error,
    },
    message: {
      color: colors.text.primary,
    },
    button: {
      backgroundColor: colors.primary,
    },
    supportButton: {
      backgroundColor: colors.secondary,
    },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Text style={[styles.title, dynamicStyles.title]}>שגיאה</Text>
      <Text style={[styles.message, dynamicStyles.message]}>{errorMessage()}</Text>

      {showNetworkCheck && renderLastOnlineInfo()}
      {showDetails && (
        <Text style={[styles.detailsText, {color: colors.text.secondary}]}>{errorDetails()}</Text>
      )}

      <View style={styles.buttonContainer}>
        {retry && (
          <TouchableOpacity
            style={[styles.button, dynamicStyles.button]}
            onPress={retry}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>נסה שוב {retryCount > 0 ? `(${retryCount})` : ''}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, dynamicStyles.supportButton]}
          onPress={handleContactSupport}
          activeOpacity={0.8}>
          <Text style={styles.buttonText}>צור קשר עם התמיכה</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 12,
    padding: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'right',
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    lineHeight: 22,
    textAlign: 'right',
  },
  detailsText: {
    fontSize: 12,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'left',
    direction: 'ltr',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  lastOnlineContainer: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  lastOnlineText: {
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ErrorMessage;
