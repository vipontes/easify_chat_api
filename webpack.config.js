const path = require('path');

const {
  NODE_ENV = 'production',
} = process.env;

const config = {
  entry: './server.js',
  mode: NODE_ENV,
  target: 'node',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'api.bundle.js'
  },
  resolve: {
    extensions: ['.js'],
  }
}

module.exports = config;