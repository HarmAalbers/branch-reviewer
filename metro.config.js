const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const metroResolver = require('metro-resolver');

const defaultConfig = getDefaultConfig(__dirname);
// Remove unknown/deprecated options that trigger Metro validation warnings
if (defaultConfig.server && 'forwardClientLogs' in defaultConfig.server) {
  delete defaultConfig.server.forwardClientLogs;
}
if (
  defaultConfig.watcher &&
  'unstable_workerThreads' in defaultConfig.watcher
) {
  delete defaultConfig.watcher.unstable_workerThreads;
}

const rnPath = path.dirname(require.resolve('react-native/package.json'));

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Ensure Metro knows about the macOS platform
    platforms: ['macos', ...defaultConfig.resolver.platforms],
    // Help Metro resolve the aliased react-native package (react-native-macos)
    extraNodeModules: {
      'react-native': rnPath,
      'react-native-macos': rnPath,
    },
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
    resolveRequest(context, moduleName, platform) {
      if (
        moduleName === 'react-native' ||
        moduleName === 'react-native-macos'
      ) {
        return { type: 'sourceFile', filePath: path.join(rnPath, 'index.js') };
      }
      return metroResolver.resolve(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
