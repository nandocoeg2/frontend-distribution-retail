module.exports = [
  // Add support for native node modules
  {
    test: /native_modules[/\\].+\.node$/,
    use: 'node-loader',
  },
  {
    test: /[/\\]node_modules[/\\].+\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules',
      },
    },
  },
  // Tambahkan rule Babel untuk JSX/React
  {
    test: /\.jsx?$/, // support .js dan .jsx
    exclude: /(node_modules|.webpack)/,
    use: {
      loader: 'babel-loader',
      options: {
        presets: ['@babel/preset-env', '@babel/preset-react'],
        plugins: [
          process.env.NODE_ENV === 'development' &&
            require.resolve('react-refresh/babel'),
        ].filter(Boolean),
      },
    },
  },
];
