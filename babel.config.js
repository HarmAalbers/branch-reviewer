module.exports = {
  presets: [
    [
      'module:@react-native/babel-preset',
      {
        // Avoid externalizing helpers to @babel/runtime to sidestep Metro resolution issues
        enableBabelRuntime: false,
      },
    ],
  ],
};
