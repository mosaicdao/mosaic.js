'use strict';

const AbiBinProvider = require('./src/AbiBinProvider');
const Chain = require('./src/Chain');
const ChainSetup = require('./src/ChainSetup');
const Contracts = require('./src/Contracts');
const Facilitator = require('./src/Facilitator');
const Redeemer = require('./src/Redeemer');
const Setup = require('./src/Setup');
const Staker = require('./src/Staker');
const StakeHelper = require('./src/helpers/StakeHelper');
const TypedData = require('./src/utils/EIP712SignerExtension/TypedData');

const Anchor = require('./src/ContractInteract/Anchor');
const EIP20CoGateway = require('./src/ContractInteract/EIP20CoGateway');
const EIP20Gateway = require('./src/ContractInteract/EIP20Gateway');
const EIP20Token = require('./src/ContractInteract/EIP20Token');
const GatewayLib = require('./src/ContractInteract/GatewayLib');
const MerklePatriciaProof = require('./src/ContractInteract/MerklePatriciaProof');
const MessageBus = require('./src/ContractInteract/MessageBus');
const Organization = require('./src/ContractInteract/Organization');
const OSTPrime = require('./src/ContractInteract/OSTPrime');
const UtilityToken = require('./src/ContractInteract/UtilityToken');
const Mosaic = require('./src/Mosaic');

const Utils = require('./src/utils/Utils');

// FIXME: https://github.com/OpenSTFoundation/mosaic.js/issues/66 Entry should not run the extender.
require('./src/utils/EIP712SignerExtension/extender')();

/*
 * The below construct with the Helpers class was added to ensure the printing of the
 * deprecation warnings for deprecated classes (StakeHelper and ChainSetup).
 * Once the deprecated code is removed, it should be simplified.
 */

class Helpers {
  static get StakeHelper() {
    Utils.deprecationNoticeStakeHelper();

    return StakeHelper;
  }
}

/**
 * Exports mosaic class and adds static getters for all other modules that should be exported.
 */
class MosaicWithExports extends Mosaic {
  static get AbiBinProvider() {
    return AbiBinProvider;
  }

  static get Chain() {
    return Chain;
  }

  static get ChainSetup() {
    Utils.deprecationNoticeChainSetup('ChainSetup');

    return ChainSetup;
  }

  static get Contracts() {
    return Contracts;
  }

  static get ContractInteract() {
    return {
      Anchor,
      EIP20CoGateway,
      EIP20Gateway,
      EIP20Token,
      GatewayLib,
      MerklePatriciaProof,
      MessageBus,
      Organization,
      OSTPrime,
      UtilityToken,
    };
  }

  static get Facilitator() {
    return Facilitator;
  }

  static get Helpers() {
    return Helpers;
  }

  static get Redeemer() {
    return Redeemer;
  }

  static get Setup() {
    return Setup;
  }

  static get Staker() {
    return Staker;
  }

  static get Utils() {
    return {
      EIP712TypedData: TypedData,
      createSecretHashLock: Utils.createSecretHashLock,
    };
  }
}

module.exports = MosaicWithExports;
