const webpack = require('webpack');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = [
  new webpack.DefinePlugin({
    'process.env.BACKEND_BASE_URL': JSON.stringify(
      process.env.APP_ENV === 'development'
        ? process.env.BACKEND_BASE_URL_DEV
        : process.env.BACKEND_BASE_URL_LOCAL
    ),
  }),
];
