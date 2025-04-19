import React, {useState} from 'react';
import {Clipboard, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

interface DevErrorBannerProps {
  error: unknown;
  label?: string;
}

const DevErrorBanner: React.FC<DevErrorBannerProps> = ({error, label = 'Error'}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // אם אין שגיאה - לא מציג כלום
  if (!error || !__DEV__) {
    return null;
  }

  // Improved error message handling
  let errorMessage: string;
  try {
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Attempt to stringify, but catch potential errors (e.g., circular references)
      try {
        errorMessage = JSON.stringify(error, null, 2);
      } catch (stringifyError) {
        errorMessage = '[שגיאה מורכבת - לא ניתן להמיר ל-JSON]';
      }
    } else {
      errorMessage = String(error);
    }
  } catch (processingError) {
    errorMessage = '[שגיאה לא ידועה בעיבוד הודעת השגיאה]';
  }

  const toggleExpand = (): void => {
    setIsExpanded(!isExpanded);
  };

  const copyToClipboard = (): void => {
    // מעתיק את השגיאה ללוח
    let textToCopy: string;
    try {
      if (typeof error === 'object' && error !== null) {
        // Attempt to stringify for copying
        try {
          if (error instanceof Error) {
            // Safely access stack property
            let stack: string;
            try {
              stack = error.stack || '[Stack trace unavailable]';
            } catch (e) {
              stack = '[Stack trace unavailable]';
            }
            textToCopy = `${error.name}: ${error.message}\n${stack}`;
          } else {
            textToCopy = JSON.stringify(error, null, 2);
          }
        } catch (stringifyError) {
          textToCopy = `[שגיאה מורכבת - לא ניתן להמיר ל-JSON]: ${String(error)}`;
        }
      } else {
        textToCopy = String(error);
      }
    } catch (processingError) {
      textToCopy = '[שגיאה לא ידועה בעיבוד הודעת השגיאה להעתקה]';
    }

    Clipboard.setString(textToCopy);
    // בדרך כלל כדאי להראות הודעה קצרה שהועתק בהצלחה
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.headerContainer} onPress={toggleExpand} activeOpacity={0.8}>
        <View style={styles.labelContainer}>
          <View style={styles.indicator} />
          <Text style={styles.label}>{label}</Text>
        </View>
        <TouchableOpacity
          onPress={copyToClipboard}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
          <Text style={styles.copyButton}>העתק</Text>
        </TouchableOpacity>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.errorContent}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#ffefef',
    borderWidth: 1,
    borderColor: '#ffcbcb',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff6b6b',
    marginRight: 8,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#e12929',
  },
  copyButton: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  errorContent: {
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ffcbcb',
  },
  errorText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    color: '#333',
  },
});

export default DevErrorBanner;
