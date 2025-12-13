import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export default {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    main: './src/index.ts',
    'service-worker': './src/service-worker.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
      { test: /\.(js|mjs)$/, exclude: /node_modules/, use: 'babel-loader' },
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader',
        options: { partialDirs: ['./src/components'] },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: 'css-loader', options: { url: false } },
        ],
      },
      {
        test: /\.(woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
        generator: { filename: 'fonts/[name][ext]' },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: { filename: 'assets/images/[name][ext]' },
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: path.resolve(__dirname, 'dist/public'),
          noErrorOnMissing: true,
        },
      ],
    }),

    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      filename: 'index.html',
      favicon: './public/globalImages/favicon.svg',
      chunks: ['main'],
    }),

    new webpack.DefinePlugin({
      'process.env.API_BASE_URL': JSON.stringify(
        process.env.API_BASE_URL || 'http://localhost:8080',
      ),
      'process.env.WS_URL': JSON.stringify(
        process.env.WS_URL || 'ws://localhost:8080/api/ws',
      ),
    }),

    new MiniCssExtractPlugin({
      filename: 'styles/[name].css',
    }),
  ],
  resolve: {
    extensions: ['.js', '.mjs','.ts'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      services: path.resolve(__dirname, 'src/services'),
    },
  },
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    hot: true,
    port: 3000,
    historyApiFallback: true,
  },
};
