const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.tsx',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist/'),
    publicPath: "/dist/"
  },
  devtool: 'source-map',
  devServer: {
      contentBase: '.'
  },

  resolve: {
    extensions: [".ts", ".tsx", ".js", ".glsl"]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
