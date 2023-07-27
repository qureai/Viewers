const webpack = require('webpack');
const { merge } = require('webpack-merge');
const path = require('path');
const webpackCommon = require('./../../../.webpack/webpack.base.js');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const pkg = require('./../package.json');

const ROOT_DIR = path.join(__dirname, './..');
const SRC_DIR = path.join(__dirname, '../src');
const DIST_DIR = path.join(__dirname, '../dist');
const ENTRYPOINT = path.join(__dirname, '../', pkg.module);

module.exports = (env, argv) => {
  const commonConfig = webpackCommon(env, argv, { SRC_DIR, DIST_DIR });

  return merge(commonConfig, {
    entry: {
      app: ENTRYPOINT,
    },
    stats: {
      colors: true,
      hash: true,
      timings: true,
      assets: true,
      chunks: false,
      chunkModules: false,
      modules: false,
      children: false,
      warnings: true,
    },
    optimization: {
      minimize: false,
      sideEffects: true,
    },
    output: {
      path: ROOT_DIR,
      library: 'ohif-extension-cornerstone',
      libraryTarget: 'umd',
      filename: pkg.main,
    },
    // output: {
    //   path: ROOT_DIR,
    //   library: 'OHIFExtCornerstone',
    //   libraryTarget: 'commonjs2',
    //   libraryExport: 'default',
    //   filename: pkg.main,
    // },
    // externals: [
    //   {
    //     react: {
    //       root: 'React',
    //       commonjs2: 'react',
    //       commonjs: 'react',
    //       amd: 'react',
    //     },
    //     react: {
    //       root: 'ReactDOM',
    //       commonjs2: 'react-dom',
    //       commonjs: 'react-dom',
    //       amd: 'react-dom',
    //     },
    //   },
    // ],
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      new MiniCssExtractPlugin({
        filename: './dist/[name].css',
        chunkFilename: './dist/[id].css',
      }),
    ],
  });
};
