const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const isDev = process.env.NODE_ENV === 'development';

// support CSS with PostCSS and Tailwind
rules.push({
  test: /\.css$/,
  use: [
    { loader: 'style-loader' },
    { loader: 'css-loader' },
    { loader: 'postcss-loader' },
  ],
});

// support Babel + React (kalau belum ada di webpack.rules.js)
rules.push({
  test: /\.jsx?$/,
  exclude: /(node_modules|.webpack)/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: ['@babel/preset-env', '@babel/preset-react'],
      plugins: [isDev && require.resolve('react-refresh/babel')].filter(
        Boolean
      ),
    },
  },
});

module.exports = {
  module: {
    rules,
  },
  plugins: [...plugins, isDev && new ReactRefreshWebpackPlugin()].filter(
    Boolean
  ),
};
