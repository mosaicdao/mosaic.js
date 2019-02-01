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
const Utils = require('../utils/Utils');
const ProofUtils = require('../utils/ProofUtils');

const MessageStatus = Utils.messageStatus();

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

    this.stakeHelper = new StakeHelper(
      originWeb3,
      auxiliaryWeb3,
      gatewayAddress,
      coGatewayAddress,
    );
    this.stake = this.stake.bind(this);
    this.progressStake = this.progressStake.bind(this);
    this.confirmStakeIntent = this.confirmStakeIntent.bind(this);
    this.getProof = this.getProof.bind(this);
  }

  /**
   * Performs the stake process.
   *
   * @param {string} staker Staker address.
   * @param {string} amount Stake amount.
   * @param {string} beneficiary Beneficiary address for minting tokens.
   * @param {string} gasPrice Gas price for reward calculation.
   * @param {string} gasLimit Maximum gas for reward calculation.
   * @param {string} [unlockSecret] Unlock secret that will be used for progress stake.
   * @param {Object} txOption Transaction options.
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
    txOption,
  ) {
    if (!web3.utils.isAddress(staker)) {
      throw new Error('Invalid staker address.');
    }

    if (new BN(amount).eqn(0)) {
      throw new Error('Stake amount must not be zero.');
    }

    if (!web3.utils.isAddress(beneficiary)) {
      throw new Error('Invalid beneficiary address.');
    }

    if (gasPrice === undefined) {
      throw new Error('Invalid gas price.');
    }

    if (gasLimit === undefined) {
      throw new Error('Invalid gas limit.');
    }

    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }

    if (!web3.utils.isAddress(txOption.from)) {
      throw new Error('Invalid facilitator address.');
    }

    // Get staker nonce.
    const nonce = await this.stakeHelper.getNonce(staker);
    const facilitatorAddress = txOption.from;
    this.txOption = txOption;
    this.hashLockObj = await this.getHashLock(unlockSecret);

    // Get bounty amount.
    this.bounty = new BN(await this.stakeHelper.getBounty());

    const isStakeAmountApproved = await this.stakeHelper.isStakeAmountApproved(
      staker,
      amount,
    );

    if (!isStakeAmountApproved) {
      if (staker === facilitatorAddress) {
        await this.stakeHelper.approveStakeAmount(staker, amount, txOption);
      } else {
        throw new Error('Transfer of stake amount must be approved.');
      }
    }

    if (this.bounty.gtn(0)) {
      const isBountyAmountApproved = await this.stakeHelper.isBountyAmountApproved(
        facilitatorAddress,
      );
      if (!isBountyAmountApproved) {
        await this.stakeHelper.approveBountyAmount(txOption);
      }
    }

    // Save the stake params as it may be used in progress stake.
    this.stakeParams = {
      staker,
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock: this.hashLockObj.hashLock,
    };

    return this.stakeHelper.stake(
      staker,
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      this.hashLockObj.hashLock,
      this.txOption,
    );
  }

  /**
   * Performs the progress stake and progress mint.
   *
   * @param {Object} txOptionOrigin Transaction options for origin chain.
   * @param {Object} txOptionAuxiliary Transaction options for auxiliary chain.
   * @param {Object} [stakeRequestParams] Stake params object.
   * @param {string} [messageHash] Message hash.
   * @param {string} [secret] Unlock secret.
   *
   * @returns {Promise} Promise object.
   */
  async progressStake(
    messageHash,
    txOptionOrigin,
    txOptionAuxiliary,
    stakeRequestParams,
    secret,
  ) {
    if (!txOptionOrigin) {
      throw new Error('Invalid transaction options for origin chain.');
    }
    if (!txOptionAuxiliary) {
      throw new Error('Invalid transaction options for auxiliary chain.');
    }

    const unlockSecret = secret || this.hashLockObj.unlockSecret;
    const messageHashString =
      messageHash || this.getMessageHash(stakeRequestParams);

    const stakeStatus = await this.stakeHelper.getStakeStatus(
      messageHashString,
    );
    if (stakeStatus === MessageStatus.UNDECLARED) {
      throw new Error('Invalid message hash.');
    }

    const mintStatus = await this.stakeHelper.getMintStatus(messageHashString);

    if (mintStatus === MessageStatus.UNDECLARED) {
      const stakeParams = stakeRequestParams || this.stakeParams;
      if (stakeParams === undefined) {
        throw new Error('Invalid stake parameters.');
      }
      await this.confirmStakeIntent(
        messageHash,
        stakeParams,
        txOptionAuxiliary,
      );
    }

    await this.performProgress(
      messageHash,
      unlockSecret,
      txOptionOrigin,
      txOptionAuxiliary,
    );
  }

  /**
   * Performs confirm stake intent.
   *
   * @param {string} messageHash Message hash.
   * @param {Object} [stakeRequestParams] Stake params object.
   * @param {Object} txOption Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async confirmStakeIntent(messageHash, stakeRequestParams, txOption) {
    const stakeStatus = this.stakeHelper.getStakeStatus(messageHash);
    if (!this.canPerformConfrimStakeIntent(stakeStatus)) {
      throw new Error(
        'Outbox message status must be declared, progressed or revocation declared.',
      );
    }

    // Get the latest commit height form CoGateway
    const commitedBlockHeight = await this.stakeHelper.getLatestStateRootBlockHeight();
    const proofData = this.getProof(
      messageHash,
      commitedBlockHeight,
      stakeStatus,
    );

    await this.stakeHelper.proveGateway(
      proofData.blockNumber,
      proofData.accountData,
      proofData.accountProof,
    );

    await this.stakeHelper.confirmStakeIntent(
      stakeRequestParams.staker,
      stakeRequestParams.nonce,
      stakeRequestParams.beneficiary,
      stakeRequestParams.amount,
      stakeRequestParams.gasPrice,
      stakeRequestParams.gasLimit,
      stakeRequestParams.hashLock,
      proofData.blockNumber,
      proofData.storageProof,
      txOption,
    );
  }

  /**
   * Performs progress stake and progress mint.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret for progress stake.
   * @param {Object} txOptionOrigin Transaction options for origin chain.
   * @param {Object} txOptionAuxiliary Transaction options for auxiliary chain.
   *
   * @returns {Promise} Promise object.
   */
  async performProgress(
    messageHash,
    unlockSecret,
    txOptionOrigin,
    txOptionAuxiliary,
  ) {
    return Promise.all([
      this.performProgressStake(messageHash, unlockSecret, txOptionOrigin),
      this.performProgressMint(messageHash, unlockSecret, txOptionAuxiliary),
    ]);
  }

  /**
   * Performs progress stake.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret for progress stake.
   * @param {Object} txOption Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async performProgressStake(messageHash, unlockSecret, txOption) {
    const stakeStatus = this.stakeHelper.getStakeStatus(messageHash);
    if (
      stakeStatus === MessageStatus.UNDECLARED ||
      stakeStatus === MessageStatus.REVOCATION_DECLARED ||
      stakeStatus === MessageStatus.REVOKED
    ) {
      throw new Error('Stake status must be declared or progressed.');
    }
    if (stakeStatus === MessageStatus.DECLARED) {
      await this.stakeHelper.progressStake(
        messageHash,
        unlockSecret,
        txOption,
      );
    }
    return Promise.resolve();
  }

  /**
   * Performs progress mint.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret for progress stake.
   * @param {Object} txOption Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async performProgressMint(messageHash, unlockSecret, txOption) {
    const mintStatus = this.stakeHelper.getMintStatus(messageHash);
    if (
      mintStatus === MessageStatus.UNDECLARED ||
      mintStatus === MessageStatus.REVOKED
    ) {
      throw new Error('Mint status must be declared or progressed.');
    }
    if (mintStatus === MessageStatus.DECLARED) {
      await this.stakeHelper.progressMint(messageHash, unlockSecret, txOption);
    }
    return Promise.resolve();
  }

  /**
   * Generate the message hash from the stake request params.
   *
   * @param {Object} stakeParams Stake request params.
   *
   * @returns {string} message hash.
   */
  getMessageHash(stakeParams) {
    const stakeIntentHash = Utils.getStakeIntentHash(
      stakeParams.amount,
      stakeParams.beneficiary,
      this.gatewayAddress,
    );

    const messageHash = Utils.getMessageHash(
      stakeIntentHash,
      stakeParams.nonce,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.sender,
      stakeParams.hashLock,
    );

    return messageHash;
  }

  /**
   * Gets the proof and validates it.
   *
   * @param {string} messageHash Message hash.
   * @param {string} blockNumber Block number.
   * @param {MessageStatus} status Message status.
   *
   * @returns {Object} Proof data.
   */
  async getProof(messageHash, blockNumber, status) {
    const proofUtils = new ProofUtils(this.originWeb3, this.auxiliaryWeb3);

    const proof = await proofUtils.getOutboxProof(
      this.gatewayAddress,
      [messageHash],
      blockNumber,
    );

    // TODO: validate proofdata for the status and gateway address.

    return {
      accountData: proof.encodedAccountValue,
      accountProof: proof.serializedAccountProof,
      storageProof: proof.storageProof[0].serializedProof,
      blockNumber: proof.block_number,
    };
  }

  /**
   * Checks if the confirm stake intent is possible with the given message status
   *
   * @param {MessageStatus} status Message status.
   *
   * @returns {boolean} `true` if it can perform.
   */
  canPerformConfrimStakeIntent(status) {
    return (
      status === MessageStatus.DECLARED ||
      status === MessageStatus.PROGRESSED ||
      status === MessageStatus.REVOCATION_DECLARED
    );
  }

  /**
   * Helper function to generate hash lock and unlock secrete. If unlock secret
   * is provided then it will generate the hash lock.
   *
   * @param {string} unlockSecret Unlock secret.
   *
   * @returns {Object} An object containing hash lock and unlock secret.
   */
  getHashLock(unlockSecret) {
    let hashLock = {};

    if (unlockSecret === undefined) {
      hashLock = Utils.createSecretHashLock();
    } else {
      hashLock = Utils.toHashLock(unlockSecret);
    }

    return hashLock;
  }
}

module.exports = Facilitator;
