const webpack = require('webpack');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

module.exports = [
  new webpack.DefinePlugin({
    'process.env.BACKEND_BASE_URL_LOCAL': JSON.stringify(process.env.BACKEND_BASE_URL_LOCAL),
    'process.env.BACKEND_BASE_URL_DEV': JSON.stringify(process.env.BACKEND_BASE_URL_DEV),
  }),
];
