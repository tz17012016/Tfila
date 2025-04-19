const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

// The directories that need to be created
const directories = [
  'node_modules/@react-native-async-storage/async-storage/android/build/generated/source/codegen/jni',
  'node_modules/react-native-bootsplash/android/build/generated/source/codegen/jni',
];

// Root directory
const rootDir = process.cwd();

// Create directories if they don't exist
directories.forEach(dir => {
  const fullPath = path.join(rootDir, dir);
  if (!fs.existsSync(fullPath)) {
    console.log(`Creating directory: ${fullPath}`);
    fs.mkdirSync(fullPath, {recursive: true});
  }
});

// Clean Android build directory
try {
  console.log('Cleaning Android build directories...');

  // Remove build directories in android folder
  const androidBuildDir = path.join(rootDir, 'android/app/build');
  if (fs.existsSync(androidBuildDir)) {
    fs.rmSync(androidBuildDir, {recursive: true, force: true});
    console.log('Removed Android app build directory');
  }

  // Clean .gradle caches if necessary
  const gradleCacheDir = path.join(rootDir, 'android/.gradle');
  if (fs.existsSync(gradleCacheDir)) {
    fs.rmSync(gradleCacheDir, {recursive: true, force: true});
    console.log('Removed .gradle cache directory');
  }

  console.log('Build directories cleaned successfully');
} catch (error) {
  console.error('Error cleaning build directories:', error);
}

console.log('Clean-up completed successfully');
