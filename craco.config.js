const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        process: false,
        fs: false,
        net: false,
        tls: false,
      };
      
      // Ignore source map warnings
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module not found: Error: Can't resolve 'crypto'/,
        /Module not found: Error: Can't resolve 'stream'/,
      ];
      
      return webpackConfig;
    },
  },
};
