import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useGetDbQuery} from '../data/redux/api/dbApi';
import {RootState} from '../data/store/rootReducer';
import {OlehLaTorah} from '../models';

interface OlimLaToraProps {
  maxItems?: number;
  showDate?: boolean;
}

interface CachedDb {
  dbData?: {
    olimLaTora?: OlehLaTorah[];
  } | null;
}

const OlimLatora: React.FC<OlimLaToraProps> = ({maxItems, showDate = true}) => {
  const {data: liveData, isSuccess} = useGetDbQuery(undefined);
  const cachedDb = useSelector<RootState, CachedDb>((state: RootState) => state.cachedDb);

  const olimLaToraData: OlehLaTorah[] = isSuccess
    ? liveData?.olimLaToraData
    : cachedDb?.dbData?.olimLaTora || [];

  const isOffline = !isSuccess && !!cachedDb?.dbData?.olimLaTora;

  if (!Array.isArray(olimLaToraData) || olimLaToraData.length === 0) {
    return null;
  }

  // אם יש הגבלת פריטים להצגה
  const displayData = maxItems ? olimLaToraData.slice(0, maxItems) : olimLaToraData;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isOffline && styles.offlineTitle]}>
        עולים לתורה {isOffline ? '📡 (מטמון)' : ''}
      </Text>

      {displayData.map((person, index) => (
        <View key={index} style={styles.personRow}>
          <Text style={styles.personName}>{person.name}</Text>
          {person.aliyah && <Text style={styles.aliyaType}>{person.aliyah}</Text>}
          {showDate && person.date && <Text style={styles.date}>{person.date}</Text>}
          {/* {person.notes && <Text style={styles.notes}>{person.notes}</Text>} */}
        </View>
      ))}
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
  personRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexWrap: 'wrap',
  },
  personName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  aliyaType: {
    fontSize: 14,
    color: '#077b80',
    marginLeft: 8,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  notes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    width: '100%',
    textAlign: 'right',
    marginTop: 4,
  },
});

export default OlimLatora;
