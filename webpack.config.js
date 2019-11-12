const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'rpgmakermv', 'js', 'plugins'),
    filename: 'FreeMove.js'
  },
  devtool: 'source-map',
  target: 'web',
  devServer: {
    contentBase: path.join(__dirname, 'rpgmakermv'),
    port: 3000
  }
};