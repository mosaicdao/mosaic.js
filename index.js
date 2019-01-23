'use strict';

const AbiBinProvider = require('./libs/AbiBinProvider');
const ChainSetup = require('./libs/ChainSetup');
const Contracts = require('./libs/Contracts');
const StakeHelper = require('./libs/helpers/StakeHelper');
const TypedData = require('./libs/utils/EIP712SignerExtension/TypedData');

const signEIP712Extender = require('./libs/utils/EIP712SignerExtension/extender');
signEIP712Extender();

module.exports = {
  AbiBinProvider: AbiBinProvider,
  ChainSetup: ChainSetup,
  Contracts: Contracts,
  Helpers: {
    StakeHelper: StakeHelper
  },
  Utils: {
    EIP712TypedData: TypedData
  }
};
