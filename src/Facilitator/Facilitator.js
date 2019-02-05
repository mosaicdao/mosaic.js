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
const Web3 = require('web3');
const EIP20Gateway = require('../ContractInteract/EIP20Gateway');
const EIP20CoGateway = require('../ContractInteract/EIP20CoGateway');
const Utils = require('../utils/Utils');
const Proof = require('../utils/Proof');
const Message = require('../utils/Message');
const Logger = require('../../logger/Logger');
const Mosaic = require('../Mosaic');

const logger = new Logger('facilitator');
const MessageStatus = Message.messageStatus();

/**
 * Class to facilitate stake and mint.
 */
class Facilitator {
  /**
   * Constructor for facilitator.
   *
   * @param {Object} mosaic Mosaic object.
   */
  constructor(mosaic) {
    if (!(mosaic instanceof Mosaic)) {
      const err = new TypeError('Invalid mosaic object.');
      throw err;
    }
    if (!(mosaic.origin.web3 instanceof Web3)) {
      const err = new TypeError('Invalid origin web3 object.');
      throw err;
    }
    if (!(mosaic.auxiliary.web3 instanceof Web3)) {
      const err = new TypeError('Invalid auxiliary web3 object.');
      throw err;
    }
    if (!Web3.utils.isAddress(mosaic.origin.contractAddresses.EIP20Gateway)) {
      const err = new TypeError('Invalid Gateway address.');
      throw err;
    }
    if (
      !Web3.utils.isAddress(mosaic.auxiliary.contractAddresses.EIP20CoGateway)
    ) {
      const err = new TypeError('Invalid CoGateway address.');
      throw err;
    }

    this.mosaic = mosaic;
    this.gateway = new EIP20Gateway(
      mosaic.origin.web3,
      mosaic.origin.contractAddresses.EIP20Gateway,
    );
    this.coGateway = new EIP20CoGateway(
      mosaic.auxiliary.web3,
      mosaic.auxiliary.contractAddresses.EIP20CoGateway,
    );

    this.stake = this.stake.bind(this);
    this.progressStake = this.progressStake.bind(this);
    this.confirmStakeIntent = this.confirmStakeIntent.bind(this);
    this.getProof = this.getProof.bind(this);
    this.progressStakeMessage = this.progressStakeMessage.bind(this);
    this.performProgressStake = this.performProgressStake.bind(this);
    this.performProgressMint = this.performProgressMint.bind(this);
    this.getCoGatewayProof = this.getCoGatewayProof.bind(this);
  }

  /**
   * Performs the stake process.
   *
   * @param {string} staker Staker address.
   * @param {string} amount Stake amount.
   * @param {string} beneficiary Beneficiary address for minting tokens.
   * @param {string} gasPrice Gas price for reward calculation.
   * @param {string} gasLimit Maximum gas for reward calculation.
   * @param {string} hashLock Hash lock.
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
    hashLock,
    txOption,
  ) {
    logger.info('Stake');
    logger.info('-----------------------');
    if (!Web3.utils.isAddress(staker)) {
      const err = new TypeError('Invalid staker address.');
      return Promise.reject(err);
    }

    if (new BN(amount).eqn(0)) {
      const err = new TypeError('Stake amount must not be zero.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError('Invalid beneficiary address.');
      return Promise.reject(err);
    }

    if (gasPrice === undefined) {
      const err = new TypeError('Invalid gas price.');
      return Promise.reject(err);
    }

    if (gasLimit === undefined) {
      const err = new TypeError('Invalid gas limit.');
      return Promise.reject(err);
    }

    if (!txOption) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(txOption.from)) {
      const err = new TypeError('Invalid facilitator address.');
      return Promise.reject(err);
    }

    let stakeHashLock = hashLock;
    if (hashLock === undefined) {
      logger.info('* Generating hash lock and unlock secret *');
      const hashLockObj = await this.getHashLock();
      stakeHashLock = hashLockObj.hashLock;
      logger.info(`  - hash lock generated is ${stakeHashLock}`);
      logger.info(
        `  - unlock secrete generated is ${hashLockObj.unlockSecret}`,
      );
    }

    const facilitatorAddress = txOption.from;

    logger.info(
      '* Checking if staker has approved gateway for token transfer *',
    );
    const isStakeAmountApproved = await this.gateway
      .isStakeAmountApproved(staker, amount)
      .catch((exception) => {
        logger.info('  - Exception while checking stake amount approval');
        return Promise.reject(exception);
      });

    logger.info(`  - Approval status is ${isStakeAmountApproved}`);

    if (!isStakeAmountApproved) {
      if (staker === facilitatorAddress) {
        logger.info(
          '  - As staker is facilitator, approving gateway for token transfer',
        );
        await this.gateway
          .approveStakeAmount(amount, txOption)
          .catch((exception) => {
            logger.info(
              '  - Failed to approve gateway contract for token transfer',
            );
            return Promise.reject(exception);
          });
      } else {
        logger.info('  - Cannot perform stake.');
        const err = new Error('Transfer of stake amount must be approved.');
        return Promise.reject(err);
      }
    }

    logger.info(
      '* Checking if facilitator has approved gateway for bounty token transfer *',
    );
    const isBountyAmountApproved = await this.gateway
      .isBountyAmountApproved(facilitatorAddress)
      .catch((exception) => {
        logger.info('  - Exception while checking bounty amount approval');
        return Promise.reject(exception);
      });

    logger.info(`  - Approval status is ${isBountyAmountApproved}`);

    if (!isBountyAmountApproved) {
      logger.info('  - Approving gateway contract for bounty transfer');
      await this.gateway.approveBountyAmount(txOption).catch((exception) => {
        logger.info(
          '  - Failed to approve gateway contract for bounty transfer',
        );
        return Promise.reject(exception);
      });
    }

    logger.info('* Getting nonce for the staker account *');
    const nonce = await this.gateway.getNonce(staker).catch((exception) => {
      logger.info('  - Failed to get staker nonce');
      return Promise.reject(exception);
    });
    logger.info(`  - Staker's nonce is ${nonce}`);

    logger.info('* Performing stake *');
    return this.gateway
      .stake(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        txOption,
      )
      .then((stakeResult) => {
        logger.info('  - Succcessfully performed stake.');
        return Promise.resolve(stakeResult);
      })
      .catch((exception) => {
        logger.info('  - Failed to performed stake.');
        return Promise.reject(exception);
      });
  }

  /**
   * Performs the progress stake and progress mint.
   *
   * @param {string} staker Staker address.
   * @param {string} amount Stake amount.
   * @param {string} beneficiary Beneficiary address for minting tokens.
   * @param {string} gasPrice Gas price for reward calculation.
   * @param {string} gasLimit Maximum gas for reward calculation.
   * @param {string} nonce Stake nonce.
   * @param {string} hashLock Hash lock.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptionOrigin Transaction options for origin chain.
   * @param {Object} txOptionAuxiliary Transaction options for auxiliary chain.
   *
   * @returns {Promise} Promise object.
   */
  progressStake(
    staker,
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    hashLock,
    unlockSecret,
    txOptionOrigin,
    txOptionAuxiliary,
  ) {
    logger.info('Performing stake and mint');
    logger.info('-----------------------');
    if (!Web3.utils.isAddress(staker)) {
      const err = new TypeError('Invalid staker address.');
      return Promise.reject(err);
    }

    if (new BN(amount).eqn(0)) {
      const err = new TypeError('Stake amount must not be zero.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError('Invalid beneficiary address.');
      return Promise.reject(err);
    }

    if (gasPrice === undefined) {
      const err = new TypeError('Invalid gas price.');
      return Promise.reject(err);
    }

    if (gasLimit === undefined) {
      const err = new TypeError('Invalid gas limit.');
      return Promise.reject(err);
    }

    if (nonce === undefined) {
      const err = new TypeError('Invalid staker nonce.');
      return Promise.reject(err);
    }

    if (!txOptionOrigin) {
      const err = new TypeError(
        'Invalid transaction options for origin chain.',
      );
      return Promise.reject(err);
    }

    if (!txOptionAuxiliary) {
      const err = new TypeError(
        'Invalid transaction options for auxiliary chain.',
      );
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(txOptionOrigin.from)) {
      const err = new TypeError('Invalid origin chain facilitator address.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(txOptionAuxiliary.from)) {
      const err = new TypeError(
        'Invalid auxiliary chain facilitator address.',
      );
      return Promise.reject(err);
    }

    return this.confirmStakeIntent(
      staker,
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
      unlockSecret,
      txOptionAuxiliary,
    ).then(() => {
      const messageHash = Message.getStakeMessageHash(
        amount,
        beneficiary,
        this.gateway.gatewayAddress,
        nonce,
        gasPrice,
        gasLimit,
        staker,
        hashLock,
      );

      return this.progressStakeMessage(
        messageHash,
        unlockSecret,
        txOptionOrigin,
        txOptionAuxiliary,
      );
    });
  }

  /**
   * Performs the progress redeem and progress unstake.
   *
   * @param {string} redeemer Redeemer address.
   * @param {string} nonce Redeemer nonce.
   * @param {string} beneficiary Beneficiary address for unstaking tokens.
   * @param {string} amount Redeem amount.
   * @param {string} gasPrice Gas price for reward calculation.
   * @param {string} gasLimit Maximum gas for reward calculation.
   * @param {string} nonce Stake nonce.
   * @param {string} hashLock Hash lock.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptionOrigin Transaction options for origin chain.
   * @param {Object} txOptionAuxiliary Transaction options for auxiliary chain.
   *
   * @returns {Promise} Promise object.
   */
  progressRedeem(
    redeemer,
    nonce,
    beneficiary,
    amount,
    gasPrice,
    gasLimit,
    hashLock,
    unlockSecret,
    txOptionOrigin,
    txOptionAuxiliary,
  ) {
    logger.info('Performing redeem and unstake');
    logger.info('-----------------------');
    if (!Web3.utils.isAddress(redeemer)) {
      const err = new TypeError('Invalid redeemer address.');
      return Promise.reject(err);
    }

    if (new BN(amount).eqn(0)) {
      const err = new TypeError('Redeemer amount must not be zero.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError('Invalid beneficiary address.');
      return Promise.reject(err);
    }

    if (typeof gasPrice !== 'string') {
      const err = new TypeError('Invalid gas price.');
      return Promise.reject(err);
    }

    if (typeof gasLimit !== 'string') {
      const err = new TypeError('Invalid gas limit.');
      return Promise.reject(err);
    }

    if (typeof nonce !== 'string') {
      const err = new TypeError('Invalid redeemer nonce.');
      return Promise.reject(err);
    }

    if (!txOptionOrigin) {
      const err = new TypeError(
        'Invalid transaction options for origin chain.',
      );
      return Promise.reject(err);
    }

    if (!txOptionAuxiliary) {
      const err = new TypeError(
        'Invalid transaction options for auxiliary chain.',
      );
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(txOptionOrigin.from)) {
      const err = new TypeError('Invalid origin chain facilitator address.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(txOptionAuxiliary.from)) {
      const err = new TypeError(
        'Invalid auxiliary chain facilitator address.',
      );
      return Promise.reject(err);
    }

    return this.confirmRedeemIntent(
      redeemer,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      txOptionOrigin,
    ).then(() => {
      const messageHash = Message.getRedeemMessageHash(
        amount,
        beneficiary,
        this.coGateway.coGatewayAddress,
        nonce,
        gasPrice,
        gasLimit,
        redeemer,
        hashLock,
      );

      return this.progressRedeemMessage(
        messageHash,
        unlockSecret,
        txOptionOrigin,
        txOptionAuxiliary,
      );
    });
  }

  /**
   * Performs confirm stake intent.
   *
   * @param {string} staker Staker address.
   * @param {string} amount Stake amount.
   * @param {string} beneficiary Beneficiary address for minting tokens.
   * @param {string} gasPrice Gas price for reward calculation.
   * @param {string} gasLimit Maximum gas for reward calculation.
   * @param {string} nonce Stake nonce.
   * @param {string} hashLock Hash lock.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async confirmStakeIntent(
    staker,
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    hashLock,
    unlockSecret,
    txOptions,
  ) {
    logger.info('Confirming stake intent');
    logger.info('-----------------------');
    if (!Web3.utils.isAddress(staker)) {
      const err = new TypeError('Invalid staker address.');
      return Promise.reject(err);
    }
    if (new BN(amount).eqn(0)) {
      const err = new TypeError('Stake amount must not be zero.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError('Invalid beneficiary address.');
      return Promise.reject(err);
    }
    if (typeof gasPrice !== 'string') {
      const err = new TypeError('Invalid gas price.');
      return Promise.reject(err);
    }
    if (typeof gasLimit !== 'string') {
      const err = new TypeError('Invalid gas limit.');
      return Promise.reject(err);
    }
    if (typeof nonce !== 'string') {
      const err = new TypeError('Invalid staker nonce.');
      return Promise.reject(err);
    }
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError('Invalid facilitator address.');
      return Promise.reject(err);
    }

    logger.info('* Generating message hash with given stake parameters *');
    const messageHash = Message.getStakeMessageHash(
      amount,
      beneficiary,
      this.gateway.gatewayAddress,
      nonce,
      gasPrice,
      gasLimit,
      staker,
      hashLock,
    );

    logger.info(`  - Message hash is ${messageHash}`);

    const stakeMessageStatus = await this.gateway
      .getOutboxMessageStatus(messageHash)
      .catch((exception) => {
        logger.info('  - Exception while getting outbox message status');
        return Promise.reject(exception);
      });

    logger.info(`  - Gateway's outbox message hash is ${stakeMessageStatus}`);

    if (stakeMessageStatus === MessageStatus.UNDECLARED) {
      const err = new Error('Stake message hash must be declared.');
      return Promise.reject(err);
    }

    const mintMessageStatus = await this.coGateway
      .getInboxMessageStatus(messageHash)
      .catch((exception) => {
        logger.info('  - Exception while getting inbox message status');
        return Promise.reject(exception);
      });

    logger.info(`  - CoGateway's inbox message hash is ${mintMessageStatus}`);

    if (
      mintMessageStatus === MessageStatus.DECLARED ||
      mintMessageStatus === MessageStatus.PROGRESSED ||
      mintMessageStatus === MessageStatus.REVOKED
    ) {
      logger.info('  - Stake intent already confirmed on CoGateway');
      return Promise.resolve(true);
    }

    return this.getGatewayProof(messageHash).then(async (proofData) => {
      logger.info('* Proving Gateway account on CoGateway *');

      return this.coGateway
        .proveGateway(
          proofData.blockNumber,
          proofData.accountData,
          proofData.accountProof,
          txOptions,
        )
        .then(() => {
          logger.info('  - Gateway was proven on CoGateway');
          return this.coGateway
            .confirmStakeIntent(
              staker,
              nonce,
              beneficiary,
              amount,
              gasPrice,
              gasLimit,
              hashLock,
              proofData.blockNumber,
              proofData.storageProof,
              txOptions,
            )
            .then((confirmStakeIntentResult) => {
              logger.info('  - Confirm stake intent successful');
              return Promise.resolve(confirmStakeIntentResult);
            });
        })
        .catch((exception) => {
          logger.info('  - Failed to prove gateway account on CoGateway');
          return Promise.reject(exception);
        });
    });
  }

  /**
   * Performs confirm redeem intent.
   *
   * @param {string} redeemer Redeemer address.
   * @param {string} nonce Redeemer nonce.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} amount Redeem amount.
   * @param {string} gasPrice Gas price for reward calculation.
   * @param {string} gasLimit Maximum gas for reward calculation.
   * @param {string} hashLock Hash lock.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async confirmRedeemIntent(
    redeemer,
    nonce,
    beneficiary,
    amount,
    gasPrice,
    gasLimit,
    hashLock,
    txOptions,
  ) {
    logger.info('Confirming redeem intent');
    logger.info('-----------------------');
    if (!Web3.utils.isAddress(redeemer)) {
      const err = new TypeError('Invalid redeemer address.');
      return Promise.reject(err);
    }
    if (new BN(amount).eqn(0)) {
      const err = new TypeError('Redeem amount must not be zero.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError('Invalid beneficiary address.');
      return Promise.reject(err);
    }
    if (typeof gasPrice !== 'string') {
      const err = new TypeError('Invalid gas price.');
      return Promise.reject(err);
    }
    if (typeof gasLimit !== 'string') {
      const err = new TypeError('Invalid gas limit.');
      return Promise.reject(err);
    }
    if (typeof nonce !== 'string') {
      const err = new TypeError('Invalid redeemer nonce.');
      return Promise.reject(err);
    }
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError('Invalid facilitator address.');
      return Promise.reject(err);
    }

    logger.info('* Generating message hash with given redeem parameters *');
    const messageHash = Message.getRedeemMessageHash(
      amount,
      beneficiary,
      this.coGateway.coGatewayAddress,
      nonce,
      gasPrice,
      gasLimit,
      redeemer,
      hashLock,
    );

    logger.info(`  - Message hash is ${messageHash}`);

    const redeemMessageStatus = await this.coGateway
      .getOutboxMessageStatus(messageHash)
      .catch((exception) => {
        logger.error('  - Exception while getting outbox message status');
        return Promise.reject(exception);
      });

    logger.info(
      `  - CoGateway's outbox message hash is ${redeemMessageStatus}`,
    );

    if (redeemMessageStatus === MessageStatus.UNDECLARED) {
      const err = new Error('Redeem message hash must be declared.');
      return Promise.reject(err);
    }

    const unstakeMessageStatus = await this.gateway
      .getInboxMessageStatus(messageHash)
      .catch((exception) => {
        logger.error('  - Exception while getting inbox message status');
        return Promise.reject(exception);
      });

    logger.info(`  - Gateway's inbox message hash is ${unstakeMessageStatus}`);

    if (
      redeemMessageStatus === MessageStatus.DECLARED ||
      redeemMessageStatus === MessageStatus.PROGRESSED ||
      redeemMessageStatus === MessageStatus.REVOKED
    ) {
      logger.win('  - Redeem intent already confirmed on Gateway');
      return Promise.resolve(true);
    }

    return this.getCoGatewayProof(messageHash).then(async (proofData) => {
      logger.info('* Proving CoGateway account on Gateway *');

      return this.gateway
        .proveGateway(
          proofData.blockNumber,
          proofData.accountData,
          proofData.accountProof,
          txOptions,
        )
        .then(() => {
          logger.info('  - CoGateway was proven on Gateway');
          return this.coGateway
            .confirmRedeemIntent(
              redeemer,
              nonce,
              beneficiary,
              amount,
              gasPrice,
              gasLimit,
              proofData.blockNumber,
              hashLock,
              proofData.storageProof,
              txOptions,
            )
            .then((confirmRedeemIntentResult) => {
              logger.info('  - Confirm redeem intent is successful');
              return Promise.resolve(confirmRedeemIntentResult);
            });
        })
        .catch((exception) => {
          logger.info('  - Failed to prove CoGateway account on Gateway');
          return Promise.reject(exception);
        });
    });
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
  async progressStakeMessage(
    messageHash,
    unlockSecret,
    txOptionOrigin,
    txOptionAuxiliary,
  ) {
    logger.info('Performing progress stake and progress mint');
    logger.info('-----------------------');
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }
    if (typeof unlockSecret !== 'string') {
      const err = new TypeError('Invalid unlock secret.');
      return Promise.reject(err);
    }
    if (txOptionOrigin === undefined) {
      const err = new TypeError('Invalid origin transaction option.');
      return Promise.reject(err);
    }
    if (txOptionAuxiliary === undefined) {
      const err = new TypeError('Invalid auxiliary transaction option.');
      return Promise.reject(err);
    }

    return Promise.all([
      this.performProgressStake(messageHash, unlockSecret, txOptionOrigin),
      this.performProgressMint(messageHash, unlockSecret, txOptionAuxiliary),
    ]);
  }

  /**
   * Performs progress redeem and progress unstake.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret for progress stake.
   * @param {Object} txOptionOrigin Transaction options for origin chain.
   * @param {Object} txOptionAuxiliary Transaction options for auxiliary chain.
   *
   * @returns {Promise} Promise object.
   */
  async progressRedeemMessage(
    messageHash,
    unlockSecret,
    txOptionOrigin,
    txOptionAuxiliary,
  ) {
    logger.info('Performing progress redeem and progress unstake');
    logger.info('-----------------------');
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }
    if (typeof unlockSecret !== 'string') {
      const err = new TypeError('Invalid unlock secret.');
      return Promise.reject(err);
    }
    if (txOptionOrigin === undefined) {
      const err = new TypeError('Invalid origin transaction option.');
      return Promise.reject(err);
    }
    if (txOptionAuxiliary === undefined) {
      const err = new TypeError('Invalid auxiliary transaction option.');
      return Promise.reject(err);
    }

    return Promise.all([
      this.performProgressRedeem(messageHash, unlockSecret, txOptionOrigin),
      this.performProgressUnstake(
        messageHash,
        unlockSecret,
        txOptionAuxiliary,
      ),
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
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }
    if (typeof unlockSecret !== 'string') {
      const err = new TypeError('Invalid unlock secret.');
      return Promise.reject(err);
    }
    if (txOption === undefined) {
      const err = new TypeError('Invalid transaction option.');
      return Promise.reject(err);
    }

    const stakeMessageStatus = await this.gateway
      .getOutboxMessageStatus(messageHash)
      .catch((exception) => {
        return Promise.reject(exception);
      });

    logger.info(
      `  - Gateway's outbox message status is ${stakeMessageStatus}`,
    );

    if (
      stakeMessageStatus === MessageStatus.UNDECLARED ||
      stakeMessageStatus === MessageStatus.REVOCATION_DECLARED ||
      stakeMessageStatus === MessageStatus.REVOKED
    ) {
      logger.info('  - Cannot perform progress stake.');
      const err = Error('Message cannot be progressed.');
      return Promise.reject(err);
    }

    if (stakeMessageStatus === MessageStatus.PROGRESSED) {
      logger.info('  - Progress stake is already done.');
      return Promise.resolve(true);
    }

    return this.gateway
      .progressStake(messageHash, unlockSecret, txOption)
      .then((progressStakeResult) => {
        logger.info('  - Progress stake successful.');
        return Promise.resolve(progressStakeResult);
      })
      .catch((exception) => {
        logger.info('  - Failed to progress stake.');
        return Promise.reject(exception);
      });
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
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }
    if (typeof unlockSecret !== 'string') {
      const err = new TypeError('Invalid unlock secret.');
      return Promise.reject(err);
    }
    if (txOption === undefined) {
      const err = new TypeError('Invalid transaction option.');
      return Promise.reject(err);
    }

    const mintMessageStatus = await this.coGateway
      .getInboxMessageStatus(messageHash)
      .catch((exception) => {
        return Promise.reject(exception);
      });

    logger.info(
      `  - CoGateway's inbox message status is ${mintMessageStatus}`,
    );

    if (
      mintMessageStatus === MessageStatus.UNDECLARED ||
      mintMessageStatus === MessageStatus.REVOKED ||
      mintMessageStatus === MessageStatus.REVOCATION_DECLARED
    ) {
      logger.info('  - Cannot perform progress mint.');
      const err = new TypeError('Message cannot be progressed.');
      return Promise.reject(err);
    }

    if (mintMessageStatus === MessageStatus.PROGRESSED) {
      logger.info('  - Progress mint is already done.');
      return Promise.resolve(true);
    }

    return this.coGateway
      .progressMint(messageHash, unlockSecret, txOption)
      .then((progressMintResult) => {
        logger.info('  - Progress mint successful.');
        return Promise.resolve(progressMintResult);
      })
      .catch((exception) => {
        logger.info('  - Failed to progress mint.');
        return Promise.reject(exception);
      });
  }

  /**
   * Performs progress unstake.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret for progress stake.
   * @param {Object} txOption Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async performProgressUnstake(messageHash, unlockSecret, txOption) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }
    if (typeof unlockSecret !== 'string') {
      const err = new TypeError('Invalid unlock secret.');
      return Promise.reject(err);
    }
    if (txOption === undefined) {
      const err = new TypeError('Invalid transaction option.');
      return Promise.reject(err);
    }

    const unstakeMessageStatus = await this.gateway
      .getInboxMessageStatus(messageHash)
      .catch((exception) => {
        return Promise.reject(exception);
      });

    logger.info(
      `  - Gateway's inbox message status is ${unstakeMessageStatus}`,
    );

    if (
      unstakeMessageStatus === MessageStatus.UNDECLARED ||
      unstakeMessageStatus === MessageStatus.REVOKED ||
      unstakeMessageStatus === MessageStatus.REVOCATION_DECLARED
    ) {
      logger.info('  - Cannot perform progress unstake.');
      const err = new TypeError('Message cannot be progressed.');
      return Promise.reject(err);
    }

    if (unstakeMessageStatus === MessageStatus.PROGRESSED) {
      logger.info('  - Progress unstake is already done.');
      return Promise.resolve(true);
    }

    return this.gateway
      .progressUnstake(messageHash, unlockSecret, txOption)
      .then((progressUnstakeResult) => {
        logger.info('  - Progress unstake successful.');
        return Promise.resolve(progressUnstakeResult);
      })
      .catch((exception) => {
        logger.info('  - Failed to progress unstake.');
        return Promise.reject(exception);
      });
  }

  /**
   * Performs progress redeem.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret for progress stake.
   * @param {Object} txOption Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async performProgressRedeem(messageHash, unlockSecret, txOption) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }
    if (typeof unlockSecret !== 'string') {
      const err = new TypeError('Invalid unlock secret.');
      return Promise.reject(err);
    }
    if (txOption === undefined) {
      const err = new TypeError('Invalid transaction option.');
      return Promise.reject(err);
    }

    const redeemMessageStatus = await this.coGateway
      .getOutboxMessageStatus(messageHash)
      .catch((exception) => {
        return Promise.reject(exception);
      });

    logger.info(
      `  - CoGateway's outbox message status is ${redeemMessageStatus}`,
    );

    if (
      redeemMessageStatus === MessageStatus.UNDECLARED ||
      redeemMessageStatus === MessageStatus.REVOCATION_DECLARED ||
      redeemMessageStatus === MessageStatus.REVOKED
    ) {
      logger.info('  - Cannot perform progress redeem.');
      const err = Error('Message cannot be progressed.');
      return Promise.reject(err);
    }

    if (redeemMessageStatus === MessageStatus.PROGRESSED) {
      logger.info('  - Progress redeem is already done.');
      return Promise.resolve(true);
    }

    return this.coGateway
      .progressRedeem(messageHash, unlockSecret, txOption)
      .then((progressStakeResult) => {
        logger.info('  - Progress redeem is successful.');
        return Promise.resolve(progressStakeResult);
      })
      .catch((exception) => {
        logger.info('  - Failed to progress redeem.');
        return Promise.reject(exception);
      });
  }

  /**
   * Perform redeem.
   *
   * @param {string} amount Redeem amount
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price.
   * @param {string} gasLimit Gas limit.
   * @param {string} nonce Redeemer's nonce.
   * @param {string} hashLock Hash lock;
   * @param {Object} txOptions Transaction options.
   * @return {Promise} Promise object
   */
  async redeem(amount, beneficiary, gasPrice, gasLimit, hashLock, txOptions) {
    logger.info('Redeem');
    logger.info('-----------------------');
    if (new BN(amount).eqn(0)) {
      const err = new TypeError('Redeem amount must not be zero.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError('Invalid beneficiary address.');
      return Promise.reject(err);
    }

    if (typeof gasPrice !== 'string') {
      const err = new TypeError('Invalid gas price.');
      return Promise.reject(err);
    }

    if (typeof gasLimit !== 'string') {
      const err = new TypeError('Invalid gas limit.');
      return Promise.reject(err);
    }

    if (typeof hashLock !== 'string') {
      const err = new TypeError('Invalid hash lock.');
      return Promise.reject(err);
    }

    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError('Invalid redeemer address.');
      return Promise.reject(err);
    }

    const redeemer = txOptions.from;

    logger.info('* Getting bounty amount *');
    const bounty = await this.coGateway.getBounty().catch((exception) => {
      logger.info('  - Exception while getting bounty amount');
      return Promise.reject(exception);
    });

    if (!new BN(txOptions.value).eq(new BN(bounty))) {
      logger.info(
        '  - Value in transaction option is not equal to the bounty amount',
      );
      return Promise.reject(false);
    }

    logger.info(
      '* Checking if redeemer has approved CoGateway for token transfer *',
    );

    const isRedeemAmountApproved = await this.coGateway
      .isRedeemAmountApproved(redeemer, amount)
      .catch((exception) => {
        logger.info('  - Exception while checking redeem amount approval');
        return Promise.reject(exception);
      });

    logger.info(`  - Approval status is ${isRedeemAmountApproved}`);

    if (!isRedeemAmountApproved) {
      /*
       * If a redeemer is initiating the redeem process through this,
       * then redeemer is the facilitator and its correct to assume that approval
       * can be done.
       */
      logger.info(
        '  - As Redeemer is facilitator, approving CoGateway for token transfer',
      );
      const approvalTxOption = Object.assign({}, txOptions);
      delete approvalTxOption.value;
      await this.coGateway
        .approveRedeemAmount(amount, approvalTxOption)
        .catch((exception) => {
          logger.info(
            '  - Failed to approve CoGateway contract for token transfer',
          );
          return Promise.reject(exception);
        });
      logger.info('  - Approval done.');
    }

    logger.info('* Getting nonce for the redeemer account *');
    const nonce = await this.coGateway
      .getNonce(redeemer)
      .catch((exception) => {
        logger.info('  - Failed to get redeemer nonce');
        return Promise.reject(exception);
      });
    logger.info(`  - Redeemer's nonce is ${nonce}`);

    logger.info('* Performing Redeem *');
    return this.coGateway
      .redeem(
        amount,
        beneficiary,
        gasPrice,
        gasLimit,
        nonce,
        hashLock,
        txOptions,
      )
      .then((redeemResult) => {
        logger.info('  - Succcessfully performed redeem.');
        return Promise.resolve(redeemResult);
      })
      .catch((exception) => {
        logger.info('  - Failed to performed redeem.');
        return Promise.reject(exception);
      });
  }

  /**
   * Gets the gateway proof and validates it.
   *
   * @param {string} messageHash Message hash.
   *
   * @returns {Object} Proof data.
   */
  getGatewayProof(messageHash) {
    logger.info('* Generating Gateway proof data *');
    return this.coGateway.getLatestAnchorInfo().then((latestAnchorInfo) => {
      const proofGenerator = new Proof(
        this.mosaic.origin.web3,
        this.mosaic.auxiliary.web3,
      );
      return this.getProof(
        proofGenerator,
        this.gateway.gatewayAddress,
        latestAnchorInfo,
        messageHash,
      );
    });
  }

  /**
   * Gets the CoGateway proof and validates it.
   *
   * @param {string} messageHash Message hash.
   *
   * @returns {Object} Proof data.
   */
  getCoGatewayProof(messageHash) {
    logger.info('* Generating CoGateway proof data *');
    return this.gateway.getLatestAnchorInfo().then((latestAnchorInfo) => {
      const proofGenerator = new Proof(
        this.mosaic.auxiliary.web3,
        this.mosaic.origin.web3,
      );
      return this.getProof(
        proofGenerator,
        this.coGateway.coGatewayAddress,
        latestAnchorInfo,
        messageHash,
      );
    });
  }

  /**
   * Gets the proof and validates it.
   *
   * @param {Object} proofGenerator Proof generator object
   * @param {string} accountAddress Account address.
   * @param {Object} latestAnchorInfo Object containing state root and block height.
   * @param {string} messageHash Message hash.
   *
   * @returns {Object} Proof data.
   */
  async getProof(
    proofGenerator,
    accountAddress,
    latestAnchorInfo,
    messageHash,
  ) {
    logger.info(
      `  - Last committed block height is ${latestAnchorInfo.blockHeight}`,
    );
    logger.info(
      `  - Last committed state root is ${latestAnchorInfo.stateRoot}`,
    );

    const blockHeight = `0x${new BN(latestAnchorInfo.blockHeight).toString(
      16,
    )}`;

    logger.info('* Generating proof data *');

    logger.info('  - Attempting to generate proof');

    return proofGenerator
      .getOutboxProof(accountAddress, [messageHash], blockHeight)
      .then((proof) => {
        logger.info('  - Proof generation successful');
        return {
          accountData: proof.encodedAccountValue,
          accountProof: proof.serializedAccountProof,
          storageProof: proof.storageProof[0].serializedProof,
          blockNumber: latestAnchorInfo.blockHeight,
          stateRoot: latestAnchorInfo.stateRoot,
        };
      })
      .catch((exception) => {
        logger.info('  - Failed to generate proof');
        return Promise.reject(exception);
      });
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
