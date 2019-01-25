// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Contracts = require('../../libs/Contracts');
const Utils = require('../utils/Utils.js');

/**
 * Class for stake helper methods
 *
 * @class
 */
class StakeHelper {
  /**
   * Constructor for stake helper.
   * @constructor
   *
   * @param {Object} originWeb3 Origin chain web3 object.
   * @param {string} valueToken Value token contract address.
   * @param {string} baseToken Base token contract address.
   * @param {string} gateway Gateway contract address.
   * @param {string} staker Stake account address.
   * @param {Object} txOptions Transaction options.
   */
  constructor(originWeb3, valueToken, baseToken, gateway, staker, txOptions) {
    this.web3 = originWeb3;
    this.valueToken = valueToken;
    this.simpleToken = baseToken;
    this.gateway = gateway;
    this.staker = staker;
    this.txOptions = txOptions || {
      gasPrice: '0x5B9ACA00'
    };
  }

  /**
   * @function getNonce
   *
   * Returns the nonce for the given staker account address.
   *
   * @param {string} staker Staker address.
   * @param {Object} originWeb3 Origin web3 object.
   * @param {string} gateway Gateway contract address.
   *
   * @returns {Promise} Promise object represents the nonce of staker address.
   */
  getNonce(staker, originWeb3, gateway) {
    const web3 = originWeb3 || this.web3;
    const gatewayAddress = gateway || this.gateway;
    const stakerAddress = staker || this.staker;

    const contract = Contracts.getEIP20Gateway(web3, gatewayAddress);

    console.log('* Fetching Staker Nonce');

    return contract.methods
      .getNonce(stakerAddress)
      .call()
      .then((nonce) => {
        console.log(`\t - Gateway Nonce for ${stakerAddress}:`, nonce);
        return nonce;
      });
  }

  /**
   * @function _approveStakeAmountRawTx
   *
   * Returns the raw transaction object for approving stake amount.
   *
   * @param {string} value Amount to approve.
   * @param {Object} txOptions Transaction options.
   * @param {Object} web3 Web3 object.
   * @param {string} valueToken Value token contract address.
   * @param {string} gateway Gateway contract address.
   * @param {string} staker Staker address.
   *
   * @returns {Object} Raw transaction object.
   */
  _approveStakeAmountRawTx(value, txOptions, web3, valueToken, gateway, staker) {
    const transactionOptions = Object.assign(
      {
        from: staker,
        to: valueToken,
        gas: '100000'
      },
      this.txOptions || {},
      txOptions || {}
    );

    const contract = Contracts.getEIP20Token(web3, valueToken, transactionOptions);

    const tx = contract.methods.approve(gateway, value);

    return tx;
  }

  /**
   * @function _stakeRawTx
   *
   * Returns the stake raw transaction object.
   *
   * @param {string} amount Amount to stake.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce.
   * @param {string} hashLock Hash lock.
   * @param {Object} txOptions Transaction options.
   * @param {Object} web3 Web3 object.
   * @param {string} gateway Gateway contract address.
   * @param {string} staker Staker address.
   *
   * @returns {Object} Raw transaction object.
   */
  _stakeRawTx(amount, beneficiary, gasPrice, gasLimit, nonce, hashLock, txOptions, web3, gateway, staker) {
    const transactionOptions = Object.assign(
      {
        from: staker,
        to: gateway,
        gas: '7000000'
      },
      this.txOptions || {},
      txOptions || {}
    );

    const contract = Contracts.getEIP20Gateway(web3, gateway, transactionOptions);

    const tx = contract.methods.stake(amount, beneficiary, gasPrice, gasLimit, nonce, hashLock);

    return tx;
  }

  /**
   * @function createSecretHashLock
   *
   * Creates a random secret string, unlock secrete and hash lock.
   *
   * @returns {HashLock} HashLock object.
   */
  static createSecretHashLock() {
    return Utils.createSecretHashLock();
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
    return Utils.toHashLock(secretString);
  }
}

module.exports = StakeHelper;
