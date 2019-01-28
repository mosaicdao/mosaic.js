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
    facilitator
  ) {
    this.stakerAddress = staker;
    this.facilitatorAddress = facilitator || staker;

    this.hashLock = await this.getHashLock(unlockSecret);
    console.log('hashLock: ', this.hashLock);

    this.stakerNonce = new BN(await this.getGatewayNonce(staker));
    console.log('stakerNonce: ', this.stakerNonce);

    this.bounty = new BN(await this.getBounty());
    console.log('bounty: ', this.bounty);

    this.valueTokenAddress = await this.getValueToken();
    console.log('valueTokenAddress: ', this.valueTokenAddress);

    this.baseTokenAddress = await this.getBaseToken();
    console.log('baseTokenAddress: ', this.baseTokenAddress);

    if (
      this.valueToken === this.baseToken &&
      this.stakerAddress === this.facilitatorAddress
    ) {
      const amountToApprove = this.stakeAmount.add(this.bounty);
      await this.approveStakeAmount(amountToApprove);
    } else {
      await this.approveBountyAmount();
      await this.approveStakeAmount(this.stakeAmount);
    }

    const gatewayContract = this.contracts.Gateway(this.gatewayAddress);

    const transactionOptions = {
      from: this.stakerAddress,
      to: this.gatewayAddress,
      gas: '7000000'
    };

    const tx = gatewayContract.methods.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      this.stakerNonce.toString(10),
      this.hashLock.hashLock
    );

    return Facilitator.sendTransaction(tx, transactionOptions);
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
  getGatewayNonce(accountAddress) {
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
    const gatewayContract = this.contracts.Gateway(this.gatewayAddress);

    return gatewayContract.methods
      .baseToken()
      .call()
      .then((baseToken) => {
        console.log('\t - Gateway baseToken:', baseToken);
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
    const gatewayContract = this.contracts.Gateway(this.gatewayAddress);

    return gatewayContract.methods
      .token()
      .call()
      .then((token) => {
        console.log('\t - Gateway token:', token);
        return token;
      });
  }

  /**
   * @function approveBountyAmount
   *
   * Approves gateway address for the bounty amount transfer.
   *
   * @returns {Promise} Promise object.
   */
  approveBountyAmount() {
    const transactionOptions = {
      from: this.facilitatorAddress,
      to: this.baseTokenAddress,
      gas: '7000000'
    };

    const baseToken = Contracts.BaseToken(
      this.baseTokenAddress,
      transactionOptions
    );

    const tx = baseToken.methods.approve(
      this.gatewayAddress,
      this.bounty.toString(10)
    );

    console.log('* Approving gateway for bounty amount');

    return Facilitator.sendTransaction(tx, transactionOptions);
  }

  /**
   * @function approveStakeAmount
   *
   * Approves gateway address for the stake amount transfer.
   *
   * @param {BN} stakeAmount Stake amount.
   *
   * @returns {Promise} Promise object.
   */
  approveStakeAmount(stakeAmount) {
    const transactionOptions = {
      from: this.stakerAddress,
      to: this.valueTokenAddress,
      gas: '7000000'
    };

    const valueToken = Contracts.ValueToken(
      this.valueTokenAddress,
      transactionOptions
    );

    const tx = valueToken.methods.approve(
      this.gatewayAddress,
      stakeAmount.toString(10)
    );

    console.log('* Approving gateway for stake amount');

    return Facilitator.sendTransaction(tx, transactionOptions);
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
      hashLock.hashLock = Utils.toHashLock(unlockSecret);
      hashLock.unlockSecret = unlockSecret;
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
  static sendTransaction(tx, txOption) {
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
