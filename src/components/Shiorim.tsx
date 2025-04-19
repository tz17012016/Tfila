import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useGetDbQuery} from '../data/redux/api/dbApi';
import {RootState} from '../data/store/rootReducer';

// Interface for individual Shior (lesson) item
interface ShiorItem {
  title: string;
  // Add other properties that might exist in your shior objects
}

// Interface for component props if needed
interface ShiorimProps {
  // Add any props here if the component accepts them
}

const Shiorim: React.FC<ShiorimProps> = () => {
  const {data: liveData, isSuccess} = useGetDbQuery(undefined);
  const cachedDb = useSelector((state: RootState) => state.cachedDb);

  // Type guard to ensure we're working with an array of ShiorItem objects
  // Add type assertion assuming CachedDbState should have shiorimData
  const shiorimData: ShiorItem[] =
    (isSuccess && liveData?.shiorimData
      ? liveData.shiorimData
      : (cachedDb as {shiorimData?: ShiorItem[]})?.shiorimData) || [];

  const isOffline = !isSuccess && !!(cachedDb as {shiorimData?: ShiorItem[]})?.shiorimData;

  // Don't render anything if no data is available
  if (!shiorimData?.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.title, isOffline && styles.offlineTitle]}>
        שיעורים {isOffline ? '📡' : ''}
      </Text>
      {shiorimData.map((shior: ShiorItem, index: number) => (
        <Text key={index} style={styles.shiorText}>
          {shior.title}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 4,
    color: '#000',
  },
  offlineTitle: {
    color: '#856404',
  },
  shiorText: {
    // Add any text styling for the shior items
  },
});

export default Shiorim;
