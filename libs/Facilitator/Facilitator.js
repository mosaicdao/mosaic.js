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
const StakeHelper = require('../helpers/StakeHelper');

/**
 * Class to facilitate stake and mint.
 */
class Facilitator {
  /**
   * Constructor for facilitator.
   *
   * @param {Object} originWeb3 Origin chain web3 object.
   * @param {Object} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} Gateway contract address.
   * @param {string} CoGateway contract address.
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
    this.gatewayAddress = gatewayAddress;
    this.coGatewayAddress = coGatewayAddress;
    this.stakeHelper = new StakeHelper(originWeb3, this.gatewayAddress);
  }

  /**
   * Performs the stake process.
   *
   * @param {string} staker Staker address.
   * @param {string} amount Stake amount.
   * @param {string} beneficiary Beneficiary address for minting tokens.
   * @param {string} [gasPrice] Gas price for reward calculation.
   * @param {string} [gasLimit] Maximum gas for reward calculation.
   * @param {string} [unlockSecret] Unlock secret that will be used for progress stake.
   * @param {Object} [txOption] Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async stake(
    staker,
    amount,
    beneficiary,
    gasPrice = '0',
    gasLimit = '0',
    unlockSecret,
    txOption,
  ) {
    if (!web3.utils.isAddress(staker)) {
      throw new Error('Invalid staker address.');
    }

    this.stakeAmount = new BN(amount);
    if (this.stakeAmount.eqn(0)) {
      throw new Error('Stake amount must not be zero.');
    }

    if (!web3.utils.isAddress(beneficiary)) {
      throw new Error('Invalid beneficiary address.');
    }

    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }

    if (!web3.utils.isAddress(txOption.from)) {
      throw new Error('Invalid facilitator address.');
    }

    this.stakerAddress = staker;
    this.facilitatorAddress = txOption.from;
    this.hashLockObj = await this.getHashLock(unlockSecret);

    // Get staker nonce.
    this.stakerNonce = new BN(await this.stakeHelper.getNonce(staker));

    // Get bounty amount.
    this.bounty = new BN(await this.stakeHelper.getBounty());

    const isStakeAmountApproved = await this.stakeHelper.isStakeAmountApproved(
      this.stakerAddress,
      this.stakeAmount.toString(10),
    );
    if (!isStakeAmountApproved) {
      await this.stakeHelper.approveStakeAmount(
        this.stakerAddress,
        this.stakeAmount.toString(10),
        txOption,
      );
    }

    if (this.bounty.gtn(0)) {
      const isBountyAmountApproved = await this.stakeHelper.isBountyAmountApproved(
        this.facilitatorAddress,
      );
      if (!isBountyAmountApproved) {
        await this.stakeHelper.approveBountyAmount(
          this.facilitatorAddress,
          txOption,
        );
      }
    }

    return this.stakeHelper.stake(
      staker,
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      this.stakerNonce.toString(10),
      this.hashLockObj.hashLock,
      txOption,
    );
  }
}

module.exports = Facilitator;
