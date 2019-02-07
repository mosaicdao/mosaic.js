'use strict';

const Mosaic = require('./src/Mosaic');
const Chain = require('./src/Chain');
const AbiBinProvider = require('./src/AbiBinProvider');
const ChainSetup = require('./src/ChainSetup');
const Contracts = require('./src/Contracts');
const StakeHelper = require('./src/helpers/StakeHelper');
const TypedData = require('./src/utils/EIP712SignerExtension/TypedData');

require('./src/utils/EIP712SignerExtension/extender')();

module.exports = {
  Mosaic,
  Chain,
  AbiBinProvider,
  ChainSetup,
  Contracts,
  Helpers: {
    StakeHelper,
  },
  Utils: {
    EIP712TypedData: TypedData,
  },
};
