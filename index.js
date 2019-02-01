'use strict';

const AbiBinProvider = require('./src/AbiBinProvider');
const ChainSetup = require('./src/ChainSetup');
const Contracts = require('./src/Contracts');
const StakeHelper = require('./src/helpers/StakeHelper');
const TypedData = require('./src/utils/EIP712SignerExtension/TypedData');

const signEIP712Extender = require('./src/utils/EIP712SignerExtension/extender');
signEIP712Extender();

module.exports = {
  AbiBinProvider: AbiBinProvider,
  ChainSetup: ChainSetup,
  Contracts: Contracts,
  Helpers: {
    StakeHelper: StakeHelper,
  },
  Utils: {
    EIP712TypedData: TypedData,
  },
};
