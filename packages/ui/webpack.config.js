const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';
const devServerPort = 9000;
const basePath = '<%= basePath %>';
const pkg = require('./package.json');

module.exports = (env) => {
  return {
    mode: 'development',
    bail: true,
    devtool: isProd ? false : 'eval-cheap-module-source-map',
    entry: ['./src/index.tsx'],
    output: {
      path: path.resolve(__dirname, '../../../../../target/apalisui/dist/static'),
      filename: `[name]${isProd ? '.[contenthash]' : ''}.js`,
      publicPath: `${isProd ? basePath : `http://localhost:${devServerPort}`}/static/`,
      publicPath: 'auto',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
      alias: {
        Typings: path.resolve(__dirname, 'typings'),
      },
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: {
                  auto: true,
                  exportLocalsConvention: 'camelCaseOnly',
                  localIdentName: isProd ? '[hash:base64:6]' : '[name]__[local]--[hash:base64:5]',
                },
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  plugins: [['postcss-preset-env']],
                },
              },
            },
          ],
        },
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                plugins: [!isProd && require.resolve('react-refresh/babel')].filter(Boolean),
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimizer: [isProd && `...`, isProd && new CssMinimizerPlugin()].filter(Boolean),
      chunkIds: 'named',
      splitChunks: {
        cacheGroups: {
          vendor: {
            test: /node_modules/,
            chunks: 'initial',
            name: 'vendor',
            priority: 10,
            enforce: true,
          },
        },
      },
    },
    plugins: [
      new webpack.DefinePlugin({
        ['process.env.APP_VERSION']: JSON.stringify(pkg.version),
        ['process.env.API_URL']: JSON.stringify(env.API_URL),
      }),
      new MiniCssExtractPlugin({
        filename: '[name].[contenthash].css',
      }),
      new HtmlWebpackPlugin({
        template: './src/index.html',
      }),
      new CleanWebpackPlugin({ cleanStaleWebpackAssets: false }),
      new CopyPlugin({
        patterns: [{ from: './src/static/', to: './' }],
      }),
      new ForkTsCheckerWebpackPlugin(),
      !isProd && new ReactRefreshWebpackPlugin(),
    ].filter(Boolean),
    devServer: {
      compress: true,
      hot: true,
      port: devServerPort,
      open: ['/'],

      devMiddleware: {
        writeToDisk: true,
      },
    },
  };
};
