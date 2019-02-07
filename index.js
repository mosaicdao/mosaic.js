'use strict';

const MosaicProvider = require('./src/Mosaic');

const AbiBinProvider = require('./src/AbiBinProvider');
const Chain = require('./src/Chain');
const ChainSetup = require('./src/ChainSetup');
const Facilitator = require('./src/Facilitator');
const Redeemer = require('./src/Redeemer');
const Staker = require('./src/Staker');
const StakeHelper = require('./src/helpers/StakeHelper');
const TypedData = require('./src/utils/EIP712SignerExtension/TypedData');

const Anchor = require('./src/ContractInteract/Anchor');
const EIP20CoGateway = require('./src/ContractInteract/EIP20CoGateway');
const EIP20Gateway = require('./src/ContractInteract/EIP20Gateway');
const EIP20Token = require('./src/ContractInteract/EIP20Token');
const OSTPrime = require('./src/ContractInteract/OSTPrime');

const Utils = require('./src/utils/Utils');

// FIXME: https://github.com/OpenSTFoundation/mosaic.js/issues/66 Entry should not run the extender.
require('./src/utils/EIP712SignerExtension/extender')();

/*
 * The below construct with classes and getter methods was added to ensure the printing of the
 * deprecation warnings for deprecated classes (StakeHelper and ChainSetup). Once the deprecated
 * classes have been removed, also simplify the below code:
 * ```
 * module.exports = {
 *   Mosaic: MosaicProvider,
 *   AbiBinProvider,
 *   ...
 * };
 * ```
 */

class Helpers {
  static get StakeHelper() {
    Utils.deprecationNoticeStakeHelper();

    return StakeHelper;
  }
}

class Mosaic {
  static get Mosaic() {
    return MosaicProvider;
  }

  static get AbiBinProvider() {
    return AbiBinProvider;
  }

  static get Chain() {
    return Chain;
  }

  static get ChainSetup() {
    Utils.deprecationNoticeChainSetup();

    return ChainSetup;
  }

  static get Contracts() {
    return {
      Anchor,
      EIP20CoGateway,
      EIP20Gateway,
      EIP20Token,
      OSTPrime,
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

  static get Staker() {
    return Staker;
  }

  static get Utils() {
    return { EIP712TypedData: TypedData };
  }
}

module.exports = Mosaic;
