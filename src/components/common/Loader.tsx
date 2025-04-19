import React from 'react';
import {ActivityIndicator, ActivityIndicatorProps, StyleSheet, Text, View} from 'react-native';
import {useTheme} from '../../utilities/ThemeManager';

interface LoaderProps {
  message?: string;
  size?: ActivityIndicatorProps['size'];
  color?: string;
}

const Loader: React.FC<LoaderProps> = ({message = 'טוען נתונים...', size = 'large', color}) => {
  const {colors} = useTheme();
  const indicatorColor = color || colors.primary;

  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={indicatorColor} />
      <Text style={[styles.message, {color: colors.text.primary}]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    flex: 1,
  },
  message: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Loader;
