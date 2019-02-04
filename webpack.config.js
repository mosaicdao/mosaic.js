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
      minimize: true,
      minimizer: [new UglifyJsPlugin()],
    },
  };
};

const webConfig = () => commonConfig('web', '> 0.25%, not dead');

const nodeConfig = () => {
  const config = commonConfig('node', 'maintained node versions');
  return {
    ...config,
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
