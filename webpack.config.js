const path = require('path');
const nodeExternals = require('webpack-node-externals');

function createConfigBase(tsLoaderOptions = {}) {
  return {
    mode: 'development',
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist/')
    },
    devtool: 'source-map',
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".glsl", ".html", ".png"]
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
            options: tsLoaderOptions
          }
        },
        {
          test: /\.glsl$/,
          use: {
            loader: 'raw-loader'
          }
        },
        {
          test: /\.(html|png)$/,
          use: {
            loader: 'file-loader',
            options: {
              name: '[name].[ext]'
            }
          }
        }
      ]
    }
  };
}

const serverConfig = {
  ...createConfigBase({ 
    compilerOptions: {
      "module": "commonjs"
    }
  }),
  target: 'node',
  node: {
    __dirname: false
  },
  entry: { 
    'server': './src/server.ts' 
  },
  externals: [nodeExternals()]
};

const clientConfig = {
  ...createConfigBase(),
  target: 'web',
  entry: { 
    'client': './src/client.tsx' 
  },
};

module.exports = [ serverConfig, clientConfig ];
