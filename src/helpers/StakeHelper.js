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

const Web3 = require('web3');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils.js');

/**
 * Class for stake helper methods
 */
class StakeHelper {
  /**
   * Constructor for stake helper.
   *
   * @param {Object} originWeb3 Origin chain web3 object.
   * @param {Object} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} Gateway contract address.
   * @param {string} CoGateway contract address.
   */
  constructor(originWeb3, auxiliaryWeb3, gatewayAddress, coGatewayAddress) {
    if (originWeb3 === undefined) {
      throw new TypeError('Invalid origin web3 object.');
    }

    if (auxiliaryWeb3 === undefined) {
      throw new TypeError('Invalid auxiliary web3 object.');
    }

    if (!Web3.utils.isAddress(gatewayAddress)) {
      throw new TypeError('Invalid Gateway address.');
    }

    if (!Web3.utils.isAddress(coGatewayAddress)) {
      throw new TypeError('Invalid Cogateway address.');
    }

    this.originWeb3 = originWeb3;
    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.gatewayAddress = gatewayAddress;
    this.coGatewayAddress = coGatewayAddress;

    this.getBounty = this.getBounty.bind(this);
    this.getNonce = this.getNonce.bind(this);
    this.approveStakeAmount = this.approveStakeAmount.bind(this);
    this._getNonce = this._getNonce.bind(this);
    this._approveStakeAmountRawTx = this._approveStakeAmountRawTx.bind(this);
    this._stakeRawTx = this._stakeRawTx.bind(this);
  }

  /**
   * Returns the bounty amount from EIP20Gateway contract.
   *
   * @returns {Promise} Promise object represents the bounty.
   */
  async getBounty() {
    if (this.bountyAmount) {
      return Promise.resolve(this.bountyAmount);
    }

    const gatewayContract = Contracts.getEIP20Gateway(
      this.originWeb3,
      this.gatewayAddress,
    );

    return gatewayContract.methods
      .bounty()
      .call()
      .then((bounty) => {
        this.bountyAmount = bounty;
        return bounty;
      });
  }

  /**
   * Returns the EIP20 token address.
   *
   * @returns {Promise} Promise object represents EIP20 token address.
   */
  async getValueToken() {
    if (this.valueTokenAddress) {
      return Promise.resolve(this.valueTokenAddress);
    }

    const gatewayContract = Contracts.getEIP20Gateway(
      this.originWeb3,
      this.gatewayAddress,
    );

    return gatewayContract.methods
      .token()
      .call()
      .then((token) => {
        this.valueTokenAddress = token;
        return token;
      });
  }

  /**
   * Returns the gateway nonce for the given account address.
   *
   * @param {string} accountAddress Account address for which the nonce is to be fetched.
   *
   * @returns {Promise} Promise object represents the nonce of account address.
   */
  async getNonce(staker) {
    if (!Web3.utils.isAddress(staker)) {
      throw new TypeError('Invalid account address.');
    }
    return this._getNonce(staker, this.originWeb3, this.gatewayAddress);
  }

  /**
   * Returns the nonce for the given staker account address.
   *
   * @param {string} stakerAddress Staker address.
   * @param {Object} originWeb3 Origin web3 object.
   * @param {string} gateway Gateway contract address.
   *
   * @returns {Promise} Promise object represents the nonce of staker address.
   */
  _getNonce(stakerAddress, originWeb3, gateway) {
    const web3 = originWeb3 || this.originWeb3;
    const gatewayAddress = gateway || this.gatewayAddress;
    const contract = Contracts.getEIP20Gateway(web3, gatewayAddress);
    return contract.methods
      .getNonce(stakerAddress)
      .call()
      .then((nonce) => {
        return nonce;
      });
  }

  /**
   * Approves gateway address for the stake amount transfer.
   *
   * @param {string} stakeAmount Stake amount.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async approveStakeAmount(stakeAmount, txOptions) {
    return new Promise((onResolve, onReject) => {
      if (!txOptions) {
        const err = new TypeError('Invalid transaction options.');
        onReject(err);
      }
      if (!Web3.utils.isAddress(txOptions.from)) {
        const err = new TypeError('Invalid staker address.');
        onReject(err);
      }
      this.getValueToken()
        .then((valueTokenAddress) => {
          const valueToken = Contracts.getEIP20Token(
            this.originWeb3,
            valueTokenAddress,
          );
          valueToken.methods
            .approve(this.gatewayAddress, stakeAmount)
            .then((tx) => {
              Utils.sendTransaction(tx, txOptions)
                .then((result) => {
                  onResolve(result);
                })
                .catch((exception) => {
                  onReject(exception);
                });
            });
        })
        .catch((exception) => {
          onReject(exception);
        });
    });
  }

  /**
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
  _approveStakeAmountRawTx(
    value,
    txOptions,
    web3,
    valueToken,
    gateway,
    staker,
  ) {
    const transactionOptions = Object.assign(
      {
        from: staker,
        to: valueToken,
        gas: '100000',
      },
      txOptions || {},
    );

    const contract = Contracts.getEIP20Token(
      web3,
      valueToken,
      transactionOptions,
    );

    const tx = contract.methods.approve(gateway, value);

    return tx;
  }

  /**
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
  _stakeRawTx(
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    hashLock,
    txOptions,
    web3,
    gateway,
    staker,
  ) {
    const transactionOptions = Object.assign(
      {
        from: staker,
        to: gateway,
        gas: '7000000',
      },
      txOptions || {},
    );

    const contract = Contracts.getEIP20Gateway(
      web3,
      gateway,
      transactionOptions,
    );

    const tx = contract.methods.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    );

    return tx;
  }

  /**
   * Creates a random secret string, unlock secrete and hash lock.
   *
   * @returns {HashLock} HashLock object.
   */
  static createSecretHashLock() {
    return Utils.createSecretHashLock();
  }

  /**
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
