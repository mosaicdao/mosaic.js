'use strict';

const AbiBinProvider = require('./AbiBinProvider');
const Chain = require('./Chain');
const ChainSetup = require('./ChainSetup');
const Contracts = require('./Contracts');
const Facilitator = require('./Facilitator');
const Redeemer = require('./Redeemer');
const Staker = require('./Staker');
const StakeHelper = require('./helpers/StakeHelper');
const TypedData = require('./utils/EIP712SignerExtension/TypedData');

const Anchor = require('./ContractInteract/Anchor');
const EIP20CoGateway = require('./ContractInteract/EIP20CoGateway');
const EIP20Gateway = require('./ContractInteract/EIP20Gateway');
const EIP20Token = require('./ContractInteract/EIP20Token');
const OSTPrime = require('./ContractInteract/OSTPrime');

const Utils = require('./utils/Utils');

// FIXME: https://github.com/OpenSTFoundation/mosaic.js/issues/66 Entry should not run the extender.
require('./utils/EIP712SignerExtension/extender')();

/*
 * The below construct with the Helpers class was added to ensure the printing of the
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

/**
 * Mosaic stores access to two chains of a mosaic set-up: origin and auxiliary.
 * @property {Chain} origin The origin chain of this mosaic set-up.
 * @property {Chain} auxiliary The auxiliary chain of this mosaic set-up.
 */
class Mosaic {
  /**
   * Creates a new Web3 instance.
   * @param {Chain} origin The origin chain of this mosaic set-up.
   * @param {Chain} auxiliary The auxiliary chain of this mosaic set-up.
   */
  constructor(origin, auxiliary) {
    if (!(origin instanceof Chain)) {
      throw new TypeError('origin must be an instance of Chain.');
    }

    if (!(auxiliary instanceof Chain)) {
      throw new TypeError('auxiliary must be an instance of Chain.');
    }

    const mosaicPropertyConfiguration = {
      configurable: false,
      enumerable: true,
      writable: false,
    };

    Object.defineProperties(this, {
      origin: {
        value: origin,
        ...mosaicPropertyConfiguration,
      },
      auxiliary: {
        value: auxiliary,
        ...mosaicPropertyConfiguration,
      },
    });
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
    return Contracts;
  }

  static get ContractInteract() {
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
