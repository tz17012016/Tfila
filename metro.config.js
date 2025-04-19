const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      // '@hebcal/hdate': path.resolve(__dirname, 'node_modules/@hebcal/hdate/dist/esm/index.js'),
    },
    // Add 'cjs' to the default source extensions
    sourceExts: process.env.RN_SRC_EXT
      ? [...process.env.RN_SRC_EXT.split(','), 'cjs']
      : [...getDefaultConfig(__dirname).resolver.sourceExts, 'cjs'],
  },
  // Add watchFolders configuration to fix file watching issues
  watchFolders: [path.resolve(__dirname, 'node_modules')],
  // Add maxWorkers to limit the number of workers
  maxWorkers: 2,
  // Add watchOptions to ignore the problematic paths
  watcher: {
    watchOptions: {
      ignored: [
        '**/node_modules/**/*.git/**',
        '**/node_modules/**/android/build/**',
        '**/node_modules/**/.gradle/**',
      ],
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
