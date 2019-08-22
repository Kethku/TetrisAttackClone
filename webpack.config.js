const path = require('path');

module.exports = {
  mode: 'development',
  entry: { main: './src/client.ts' },
  output: {
    filename: 'client.js',
    path: path.resolve(__dirname, 'dist/'),
    publicPath: "/dist/"
  },
  devtool: 'source-map',
  devServer: {
      contentBase: '.'
  },

  resolve: {
    extensions: [".ts", ".js", ".glsl"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader"
        }
      },
      {
        test: /\.glsl$/,
        use: {
          loader: 'raw-loader'
        }
      }
    ]
  }
};
