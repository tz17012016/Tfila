import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useGetHalchYomitQuery} from '../data/redux/api/halchYomitApi';
import {RootState} from '../data/store/rootReducer';
import {HalachaYomit} from '../models';

interface HalachYomitProps {
  maxLength?: number;
  expandable?: boolean;
}

const HalachYomit: React.FC<HalachYomitProps> = ({maxLength, expandable = true}) => {
  const [expanded, setExpanded] = React.useState(false);
  const {data: liveData, isSuccess} = useGetHalchYomitQuery(undefined);
  const cachedDb = useSelector((state: RootState) => state.cachedDb);

  const halachot: HalachaYomit[] = isSuccess
    ? Array.isArray(liveData)
      ? liveData.map(item =>
          typeof item === 'string'
            ? {text: item}
            : typeof item === 'object' && item !== null && 'content' in item
            ? {text: (item as {content: string}).content, ...(item as object)}
            : (item as HalachaYomit),
        )
      : []
    : cachedDb?.halachYomit || [];

  const isOffline = !isSuccess && !!cachedDb?.halachYomit;

  if (!Array.isArray(halachot) || halachot.length === 0) {
    return null;
  }

  // הגבלת אורך הטקסט אם מוגדר ויש אפשרות להרחבה
  const displayContent = !expanded && maxLength && expandable ? halachot.slice(0, 1) : halachot;

  const toggleExpand = () => {
    if (expandable) {
      setExpanded(!expanded);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isOffline && styles.offlineTitle]}>
        הלכה יומית {isOffline ? '📡 (מטמון)' : ''}
      </Text>

      {displayContent.map((halacha, index) => (
        <View key={index} style={styles.halachaContainer}>
          {halacha.title && <Text style={styles.halachaTitle}>{halacha.title}</Text>}
          <Text style={styles.halachaText}>{halacha.text}</Text>
          {halacha.source && <Text style={styles.source}>מקור: {halacha.source}</Text>}
        </View>
      ))}

      {expandable && maxLength && halachot.length > 1 && (
        <TouchableOpacity onPress={toggleExpand} style={styles.expandButton}>
          <Text style={styles.expandButtonText}>{expanded ? 'הצג פחות' : 'הצג עוד...'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 8,
    color: '#000',
    textAlign: 'right',
  },
  offlineTitle: {
    color: '#856404',
  },
  halachaContainer: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  halachaTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#077b80',
    marginBottom: 4,
    textAlign: 'right',
  },
  halachaText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
    textAlign: 'right',
  },
  source: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'left',
  },
  expandButton: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 4,
  },
  expandButtonText: {
    color: '#077b80',
    fontWeight: '500',
  },
});

export default HalachYomit;
