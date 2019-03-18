'use strict';

const BN = require('bn.js');
const Crypto = require('crypto');
const Web3Utils = require('web3-utils');

/**
 * This class includes the utitity functions.
 * @class
 * @classdesc Provides the common utility functions.
 */
class Utils {
  /**
   * @typedef {Object} HashLock
   *
   * @property {string} secret The string that was used to generate hash lock
   * and unlock secret.
   *
   * @property {string} unlockSecret The unlock secret string.
   *
   * @property {string} hashLock The hash lock.
   */

  /**
   * @function createSecretHashLock
   *
   * Creates a random secret string, unlock secrete and hashlock.
   *
   * @returns {HashLock} HashLock object.
   */
  static createSecretHashLock() {
    const secret = Crypto.randomBytes(16).toString('hex');
    return Utils.toHashLock(secret);
  }

  /**
   * @function toHashLock
   *
   * Returns the HashLock from the given secret string.
   *
   * @param {string} secretString The secret string.
   *
   * @returns {HashLock} HashLock object.
   */
  static toHashLock(secretString) {
    const unlockSecret = Web3Utils.keccak256(secretString);
    const hashLock = Web3Utils.keccak256(unlockSecret);
    return {
      secret: secretString,
      unlockSecret,
      hashLock,
    };
  }

  /**
   * Helper function to send ethereum transaction.
   *
   * @param {Object} tx Transaction object.
   * @param {Object} tx Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  static async sendTransaction(tx, txOption) {
    return new Promise(async (onResolve, onReject) => {
      const txOptions = Object.assign({}, txOption);
      if (!txOptions.gas) {
        txOptions.gas = await tx.estimateGas(txOptions);
      }

      tx.send(txOptions)
        .on('receipt', receipt => onResolve(receipt))
        .on('error', error => onReject(error))
        .catch(exception => onReject(exception));
    });
  }

  /**
   * Checks if the max reward exceeds the amount. In that case it could not pay out the expected
   * reward.
   * @param {string} amount The amount to stake or redeem.
   * @param {string} gasPrice Gas price of the reward.
   * @param {string} gasLimit Gas limit of the process.
   */
  static maxRewardTooBig(amount, gasPrice, gasLimit) {
    const maxReward = new BN(gasPrice).mul(new BN(gasLimit));
    return (maxReward.gt(new BN(amount)));
  }

  /**
   * Prints a deprecation warning for deprecated ChainSetup methods.
   * See {@link https://github.com/openst/mosaic.js/issues/57}.
   *
   * @param {string} object Identifier of the chain setup related object that has been deprecated.
   */
  static deprecationNoticeChainSetup(object) {
    const issueNumber = '57';
    Utils.deprecationNotice(object, issueNumber);
  }

  /**
   * Prints a deprecation warning for deprecated StakeHelper.
   * See {@link https://github.com/openst/mosaic.js/issues/86}.
   *
   * @param {string} [method] The method on the StakeHelper that is deprecated.
   */
  static deprecationNoticeStakeHelper(method) {
    const issueNumber = '86';

    let object = 'StakeHelper';
    if (method !== undefined) {
      object = `${object}::${method}()`;
    }

    Utils.deprecationNotice(object, issueNumber);
  }

  /**
   * Prints a deprecation warning for deprecated code.
   *
   * @param {string} object Identifier of what has been deprecated.
   * @param {string} issueNumber Issue number on GitHub that has instructions on how to migrate.
   */
  static deprecationNotice(object, issueNumber) {
    console.warn(
      `⚠️ '${object}' has been deprecated. See https://github.com/openst/mosaic.js/issues/${issueNumber} for migration instructions.`,
    );
  }
}

module.exports = Utils;
