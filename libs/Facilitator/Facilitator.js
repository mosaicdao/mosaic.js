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

const BN = require('bn.js');
const web3 = require('web3');
const Contracts = require('../../libs/Contracts');
const Utils = require('../utils/Utils.js');

/**
 * Class to facilitate stake and mint.
 *
 * @class
 */
class Facilitator {
  /**
   * Constructor for facilitator.
   * @constructor
   *
   * @param {Object} originWeb3 Origin chain web3 object.
   * @param {Object} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} Gateway contract address.
   * @param {Object} CoGateway contract address.
   */
  constructor(originWeb3, auxiliaryWeb3, gatewayAddress, coGatewayAddress) {
    if (originWeb3 === undefined) {
      throw new Error('Invalid origin web3 object.');
    }

    if (auxiliaryWeb3 === undefined) {
      throw new Error('Invalid auxiliary web3 object.');
    }

    if (!web3.utils.isAddress(gatewayAddress)) {
      throw new Error('Invalid Gateway address.');
    }

    if (!web3.utils.isAddress(coGatewayAddress)) {
      throw new Error('Invalid Cogateway address.');
    }

    this.originWeb3 = originWeb3;
    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.contracts = new Contracts(originWeb3, auxiliaryWeb3);
    this.gatewayAddress = gatewayAddress;
    this.coGatewayAddress = coGatewayAddress;
  }

  /**
   * @function stake
   *
   * Performs the stake process.
   *
   * @param {string} staker Staker address.
   * @param {string} amount Stake amount.
   * @param {string} beneficiary Beneficiary address for minting tokens.
   * @param {string} gasPrice Gas price for reward calculation.
   * @param {string} gasLimit Mas gas for reward calculation.
   * @param {string} unlockSecret Unlock secret that will be used for progress stake.
   * @param {string} gas The gas provided for the transaction execution
   *
   * @returns {Promise} Promise object.
   */
  async stake(
    staker,
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    unlockSecret,
    facilitator,
    gas = '7000000'
  ) {
    this.stakerAddress = staker;
    this.facilitatorAddress = facilitator || staker;

    this.hashLock = await Facilitator.getHashLock(unlockSecret);
    console.log('hashLock: ', this.hashLock);

    this.stakerNonce = new BN(await this.getGatewayNonce(staker));
    console.log('stakerNonce: ', this.stakerNonce);

    this.bounty = new BN(await this.getBounty());
    console.log('bounty: ', this.bounty);

    await this.getValueToken();
    console.log('valueTokenAddress: ', this.valueTokenAddress);

    await this.getBaseToken();
    console.log('baseTokenAddress: ', this.baseTokenAddress);

    if (
      this.valueToken === this.baseToken &&
      this.stakerAddress === this.facilitatorAddress
    ) {
      const amountToApprove = this.stakeAmount.add(this.bounty);
      await this.approveStakeAmount(this.stakerAddress, amountToApprove, gas);
    } else {
      await this.approveBountyAmount(facilitator, gas);
      await this.approveStakeAmount(this.stakerAddress, this.stakeAmount, gas);
    }

    const gatewayContract = this.contracts.Gateway(this.gatewayAddress);

    const transactionOptions = {
      from: this.stakerAddress,
      to: this.gatewayAddress,
      gas: gas
    };

    const tx = gatewayContract.methods.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      this.stakerNonce.toString(10),
      this.hashLock.hashLock
    );

    return this.sendTransaction(tx, transactionOptions);
  }

  /**
   * @function getGatewayNonce
   *
   * Returns the gateway nonce for the given account address.
   *
   * @param {string} accountAddress Account address for which the nonce is to be fetched.
   *
   * @returns {Promise} Promise object represents the nonce of account address.
   */
  async getGatewayNonce(accountAddress) {
    if (!web3.utils.isAddress(accountAddress)) {
      throw new Error('Invalid account address.');
    }

    const gatewayContract = this.contracts.Gateway(this.gatewayAddress);

    return gatewayContract.methods
      .getNonce(accountAddress)
      .call()
      .then((nonce) => {
        console.log(`\t - Gateway Nonce for ${accountAddress}:`, nonce);
        return nonce;
      });
  }

  /**
   * @function getBounty
   *
   * Returns the bounty amount from EIP20Gateway contract.
   *
   * @returns {Promise} Promise object represents the bounty.
   */
  getBounty() {
    const gatewayContract = this.contracts.Gateway(this.gatewayAddress);

    return gatewayContract.methods
      .bounty()
      .call()
      .then((bounty) => {
        console.log('\t - Gateway Bounty:', bounty);
        return bounty;
      });
  }

  /**
   * @function getBaseToken
   *
   * Returns the ERC20 base token address.
   *
   * @returns {Promise} Promise object represents ERC20 base token address.
   */
  getBaseToken() {
    const oThis = this;
    if (oThis.baseTokenAddress) {
      return oThis.baseTokenAddress;
    }
    const gatewayContract = this.contracts.Gateway(this.gatewayAddress);

    return gatewayContract.methods
      .baseToken()
      .call()
      .then((baseToken) => {
        console.log('\t - Gateway baseToken:', baseToken);
        oThis.baseTokenAddress = baseToken;
        return baseToken;
      });
  }

  /**
   * @function getValueToken
   *
   * Returns the EIP20 token address.
   *
   * @returns {Promise} Promise object represents EIP20 token address.
   */
  getValueToken() {
    const oThis = this;
    if (oThis.valueTokenAddress) {
      return oThis.valueTokenAddress;
    }
    const gatewayContract = this.contracts.Gateway(this.gatewayAddress);

    return gatewayContract.methods
      .token()
      .call()
      .then((token) => {
        console.log('\t - Gateway token:', token);
        oThis.valueTokenAddress = token;
        return token;
      });
  }

  /**
   * @function approveBountyAmount
   *
   * Approves gateway address for the bounty amount transfer.
   *
   * @param {string} facilitator Facilitator address.
   * @param {string} gas The gas provided for the transaction execution
   *
   * @returns {Promise} Promise object.
   */
  async approveBountyAmount(facilitator, gas = '7000000') {
    if (!web3.utils.isAddress(facilitator)) {
      throw new Error('Invalid facilitator address.');
    }

    const baseTokenAddress = await this.getBaseToken();

    const transactionOptions = {
      from: facilitator,
      to: baseTokenAddress,
      gas: gas
    };

    const baseToken = this.contracts.BaseToken(
      baseTokenAddress,
      transactionOptions
    );

    const bountyAmount = await this.getBounty();
    const tx = baseToken.methods.approve(this.gatewayAddress, bountyAmount);

    console.log('* Approving gateway for bounty amount');

    return this.sendTransaction(tx, transactionOptions);
  }

  /**
   * @function approveStakeAmount
   *
   * Approves gateway address for the stake amount transfer.
   *
   * @param {string} stakerAddress Staker account address.
   * @param {string} stakeAmount Stake amount.
   * @param {string} gas The gas provided for the transaction execution
   *
   * @returns {Promise} Promise object.
   */
  async approveStakeAmount(stakerAddress, stakeAmount, gas = '7000000') {
    if (!web3.utils.isAddress(stakerAddress)) {
      throw new Error('Invalid staker address.');
    }

    const valueTokenAddress = await this.getValueToken();

    const transactionOptions = {
      from: stakerAddress,
      to: valueTokenAddress,
      gas: gas
    };

    const valueToken = this.contracts.ValueToken(
      valueTokenAddress,
      transactionOptions
    );

    const tx = valueToken.methods.approve(this.gatewayAddress, stakeAmount);

    console.log('* Approving gateway for stake amount');

    return this.sendTransaction(tx, transactionOptions);
  }

  /**
   * @function getHashLock
   *
   * Helper function to generate hash lock and unlock secrete. If unlock secret
   * is provided then it will generate the hash lock.
   *
   * @param {string} unlockSecret Unlock secret.
   *
   * @returns {Object} An object containing hash lock and unlock secret.
   */
  static getHashLock(unlockSecret) {
    let hashLock = {};

    if (unlockSecret === undefined) {
      hashLock = Utils.createSecretHashLock();
    } else {
      hashLock = Utils.toHashLock(unlockSecret);
    }

    return hashLock;
  }

  /**
   * @function sendTransaction
   *
   * Helper function to send ethereum transaction.
   *
   * @param {Object} tx Transaction object.
   * @param {Object} tx Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  sendTransaction(tx, txOption) {
    return tx
      .send(txOption)
      .on('transactionHash', (transactionHash) => {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', (receipt) => {
        console.log(
          '\t - Receipt:\n\x1b[2m',
          JSON.stringify(receipt),
          '\x1b[0m\n'
        );
      })
      .on('error', (error) => {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }
}

module.exports = Facilitator;
