import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { fileURLToPath } from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import dotenv from 'dotenv'; // 👈 добавили

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 подгружаем .env ДО экспорта конфига
dotenv.config();

export default {
  mode: 'development',
  devtool: 'source-map',
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve('./dist'),
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|mjs)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.hbs$/,
        loader: 'handlebars-loader',
        options: { partialDirs: ['./src/components'] },
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              url: false,
            },
          },
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
        { from: path.resolve(__dirname, 'src/service-worker.js'), to: path.resolve(__dirname, 'dist/service-worker.js') },
        { from: path.resolve(__dirname, 'public'), to: path.resolve(__dirname, 'dist/public'), noErrorOnMissing: true },
      ],
    }),

    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src', 'index.html'),
      filename: 'index.html',
      favicon: './public/globalImages/favicon.svg',
    }),

    // 👇 вот тут теперь он реально увидит то, что в .env
    new webpack.DefinePlugin({
      'process.env.API_BASE_URL': JSON.stringify(process.env.API_BASE_URL || 'http://localhost:8080'),
      'process.env.WS_URL': JSON.stringify(process.env.WS_URL || 'ws://localhost:8080/api/ws'),
    }),

    new MiniCssExtractPlugin({
      filename: 'styles/[name].css',
    }),

    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'public'), to: path.resolve(__dirname, 'dist/public'), noErrorOnMissing: true },
      ],
    }),
  ],
  resolve: {
  extensions: ['.js', '.mjs'],
  alias: {
    '@': path.resolve(__dirname, 'src'),
    '@app': path.resolve(__dirname, 'src/app'),
    '@shared': path.resolve(__dirname, 'src/shared'),
  },
},
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    hot: true,
    port: 3000,
    historyApiFallback: true, // на всякий
    // и можно сразу проксировать на бэк, тогда даже env не нужен:
    // proxy: {
    //   '/api': 'http://localhost:8080',
    // },
  },
};
