const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration for Node.js polyfills
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: require.resolve('expo-crypto'),
  stream: require.resolve('readable-stream'),
  url: require.resolve('react-native-url-polyfill'),
  util: require.resolve('util'),
  // Disable problematic jose modules
  'jose/dist/node/esm/runtime/verify.js': false,
  'jose/dist/node/esm/runtime/zlib.js': false,
};

// Add node_modules to resolver
config.resolver.nodeModulesPaths = [
  ...config.resolver.nodeModulesPaths,
  './node_modules',
];

// Configure for React Native compatibility
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Exclude problematic modules
config.resolver.blacklistRE = /node_modules\/jose\/dist\/node\//;

module.exports = config;
