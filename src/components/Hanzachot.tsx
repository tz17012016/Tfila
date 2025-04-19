import React from 'react';
import {Text, View} from 'react-native';
import {useSelector} from 'react-redux';
import {useGetDbQuery} from '../data/redux/api/dbApi';

// Define types for our component
interface HanzachaItem {
  title: string;
  name?: string;
  description?: string;
  remarks?: string;
  date?: string;
}

interface HanzachotProps {
  maxItems?: number;
}

// Type for data structure in the Redux store
interface CachedDb {
  hanzchData?: HanzachaItem[];
}

const Hanzachot: React.FC<HanzachotProps> = ({maxItems}) => {
  const {data: liveData, isSuccess} = useGetDbQuery();
  const cachedDb = useSelector((state: {cachedDb: CachedDb}) => state.cachedDb);

  const hanzchData = isSuccess ? liveData?.hanzchData : cachedDb?.hanzchData;

  const isOffline = !isSuccess && !!cachedDb?.hanzchData;

  if (!Array.isArray(hanzchData) || hanzchData.length === 0) {
    return null;
  }

  // If maxItems is provided, limit the number of items displayed
  const displayData = maxItems ? hanzchData.slice(0, maxItems) : hanzchData;

  return (
    <View style={{marginBottom: 16}}>
      <Text
        style={{
          fontWeight: 'bold',
          fontSize: 18,
          marginBottom: 4,
          color: isOffline ? '#856404' : '#000',
        }}>
        הנצחות {isOffline ? '📡 (מטמון)' : ''}
      </Text>

      {displayData.map((item, index) => (
        <Text key={index}>{item.title}</Text>
      ))}
    </View>
  );
};

export default Hanzachot;
