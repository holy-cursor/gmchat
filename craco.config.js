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
        os: require.resolve('os-browserify/browser'),
        dgram: require.resolve('dgram-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        tty: require.resolve('tty-browserify'),
        zlib: require.resolve('browserify-zlib'),
      };
      
      // Ignore source map warnings
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Module not found: Error: Can't resolve 'crypto'/,
        /Module not found: Error: Can't resolve 'stream'/,
        /Module not found: Error: Can't resolve 'dgram'/,
        /Module not found: Error: Can't resolve 'os'/,
      ];
      
      return webpackConfig;
    },
  },
};
