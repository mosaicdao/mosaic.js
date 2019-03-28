'use strict';

const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const rootPreFix = '.';
const entryFile = rootPreFix + '/index.js';
const polyfillFile = '@babel/polyfill';

const commonConfig = (target, babelTargets) => {
  return {
    target,
    entry: {
      mosaic: [polyfillFile, entryFile],
    },
    output: {
      path: path.resolve(__dirname, 'lib'),
      filename: `[name].${target}.js`,
    },
    externals: {
      web3: 'web3',
      'web3-eth-accounts': 'web3-eth-accounts',
    },
    plugins: [
      new webpack.NormalModuleReplacementPlugin(
        /\.\/AbiBinProvider-node\.js/,
        `./AbiBinProvider-${target}.js`,
      ),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: path.resolve(__dirname, 'node_modules'),
          use: [
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      targets: babelTargets,
                    },
                  ],
                ],
              },
            },
          ],
        },
        {
          test: /package\.json$/,
          loader: 'package-json-cleanup-loader',
          options: {
            only: ['version', 'name', 'otherParam'],
          },
        },
      ],
    },
    optimization: {
      minimize: target == 'web' ? true : false,
      minimizer: [new UglifyJsPlugin()],
    },
  };
};

const webConfig = () => {
  const config = commonConfig('web', '> 0.25%, not dead');
  return {
    ...config,
    output: {
      ...config.output,
      library: 'Mosaic',
      libraryTarget: 'var',
    },
  };
};

const nodeConfig = () => {
  const config = commonConfig('node', 'maintained node versions');
  return {
    ...config,
    output: {
      ...config.output,
      libraryTarget: 'commonjs2',
    },
    resolve: {
      ...config.resolve,
      alias: {
        ...(config.resolve || {}).alias,
        scrypt: 'js-scrypt',
      },
    },
    plugins: [
      ...config.plugins,
      new webpack.IgnorePlugin(/^(?:electron|ws)$/),
    ],
  };
};

module.exports = [webConfig, nodeConfig];
