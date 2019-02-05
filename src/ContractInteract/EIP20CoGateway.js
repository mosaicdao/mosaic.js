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

'use strict';

const Web3 = require('web3');
const BN = require('bn.js');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');
const Anchor = require('../ContractInteract/Anchor');
const EIP20Token = require('../ContractInteract/EIP20Token');

/**
 * Contract interact for EIP20CoGateway.
 */
class EIP20CoGateway {
  /**
   * Constructor for EIP20CoGateway.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} coGatewayAddress CoGateway contract address.
   */
  constructor(web3, coGatewayAddress) {
    if (web3 instanceof Web3) {
      this.web3 = web3;
    } else {
      const err = new TypeError(
        "Mandatory Parameter 'web3' is missing or invalid",
      );
      throw err;
    }

    if (!Web3.utils.isAddress(coGatewayAddress)) {
      const err = new TypeError(
        "Mandatory Parameter 'coGatewayAddress' is missing or invalid.",
      );
      throw err;
    }

    this.coGatewayAddress = coGatewayAddress;

    this.contract = Contracts.getEIP20CoGateway(
      this.web3,
      this.coGatewayAddress,
    );

    if (!this.contract) {
      const err = new Error(
        `Could not load CoGateway contract for: ${this.coGatewayAddress}`,
      );
      throw err;
    }

    this.proveGateway = this.proveGateway.bind(this);
    this._proveGatewayRawTx = this._proveGatewayRawTx.bind(this);
    this.confirmStakeIntent = this.confirmStakeIntent.bind(this);
    this._confirmStakeIntentRawTx = this._confirmStakeIntentRawTx.bind(this);
    this.progressMint = this.progressMint.bind(this);
    this._progressMintRawTx = this._progressMintRawTx.bind(this);
    this.getBounty = this.getBounty.bind(this);
    this.getNonce = this.getNonce.bind(this);
    this.getStateRootProviderAddress = this.getStateRootProviderAddress.bind(
      this,
    );
    this.getInboxMessageStatus = this.getInboxMessageStatus.bind(this);
    this.getOutboxMessageStatus = this.getOutboxMessageStatus.bind(this);
    this.getAnchor = this.getAnchor.bind(this);
    this.getLatestAnchorInfo = this.getLatestAnchorInfo.bind(this);
    this.getEIP20UtilityToken = this.getEIP20UtilityToken.bind(this);
    this.getUtilityToken = this.getUtilityToken.bind(this);
    this.isRedeemAmountApproved = this.isRedeemAmountApproved.bind(this);
    this.redeem = this.redeem.bind(this);
    this._redeemRawTx = this._redeemRawTx.bind(this);
  }

  /**
   * Prove gateway contract account address on auxiliary chain.
   *
   * @param {string} blockHeight Block number.
   * @param {string} encodedAccount Encoded account data.
   * @param {string} accountProof Account proof data.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  proveGateway(blockHeight, encodedAccount, accountProof, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    return this._proveGatewayRawTx(
      blockHeight,
      encodedAccount,
      accountProof,
    ).then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Get raw transaction object for prove gateway.
   *
   * @param {string} blockHeight Block number.
   * @param {string} encodedAccount Encoded account data.
   * @param {string} accountProof Account proof data.
   *
   * @returns {Promise} Promise object.
   */
  _proveGatewayRawTx(blockHeight, encodedAccount, accountProof) {
    if (blockHeight === undefined) {
      const err = new TypeError('Invalid block height.');
      return Promise.reject(err);
    }

    if (typeof encodedAccount !== 'string') {
      const err = new TypeError('Invalid account data.');
      return Promise.reject(err);
    }

    if (typeof accountProof !== 'string') {
      const err = new TypeError('Invalid account proof.');
      return Promise.reject(err);
    }

    const tx = this.contract.methods.proveGateway(
      blockHeight,
      encodedAccount,
      accountProof,
    );
    return Promise.resolve(tx);
  }

  /**
   * Performs confirm stake intent.
   *
   * @param {string} staker Staker address.
   * @param {string} nonce Staker nonce.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} amount Amount to stake.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} hashLock Hash lock.
   * @param {string} blockHeight Block number.
   * @param {string} storageProof Storage proof.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Object} Raw transaction object.
   */
  confirmStakeIntent(
    staker,
    nonce,
    beneficiary,
    amount,
    gasPrice,
    gasLimit,
    hashLock,
    blockHeight,
    storageProof,
    txOptions,
  ) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    return this._confirmStakeIntentRawTx(
      staker,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      storageProof,
    ).then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Get the raw transaction for confirm stake intent.
   *
   * @param {string} staker Staker address.
   * @param {string} nonce Staker nonce.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} amount Amount to stake.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} hashLock Hash lock.
   * @param {string} blockHeight Block number.
   * @param {string} storageProof Storage proof.
   *
   * @returns {Object} Raw transaction object.
   */
  _confirmStakeIntentRawTx(
    staker,
    nonce,
    beneficiary,
    amount,
    gasPrice,
    gasLimit,
    hashLock,
    blockHeight,
    storageProof,
  ) {
    if (!Web3.utils.isAddress(staker)) {
      const err = new TypeError('Invalid staker address.');
      return Promise.reject(err);
    }

    if (typeof nonce !== 'string') {
      const err = new TypeError('Invalid nonce.');
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError('Invalid beneficiary address.');
      return Promise.reject(err);
    }

    if (typeof amount !== 'string') {
      const err = new TypeError('Invalid stake amount.');
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

    if (typeof blockHeight !== 'string') {
      const err = new TypeError('Invalid block height.');
      return Promise.reject(err);
    }

    if (typeof storageProof !== 'string') {
      const err = new TypeError('Invalid storage proof data.');
      return Promise.reject(err);
    }

    const tx = this.contract.methods.confirmStakeIntent(
      staker,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      storageProof,
    );
    return Promise.resolve(tx);
  }

  /**
   * Performs progress mint.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} promise object.
   */
  progressMint(messageHash, unlockSecret, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    return this._progressMintRawTx(messageHash, unlockSecret).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get the raw transaction for progress mint.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret.
   *
   * @returns {Promise} promise object.
   */
  _progressMintRawTx(messageHash, unlockSecret) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }

    if (typeof unlockSecret !== 'string') {
      const err = new TypeError('Invalid unlock secret.');
      return Promise.reject(err);
    }

    const tx = this.contract.methods.progressMint(messageHash, unlockSecret);
    return Promise.resolve(tx);
  }

  /**
   * Returns the bounty amount.
   *
   * @returns {Promise} Promise object.
   */
  getBounty() {
    if (this._bountyAmount) {
      return Promise.resolve(this._bountyAmount);
    }
    return this.contract.methods
      .bounty()
      .call()
      .then((bounty) => {
        this._bountyAmount = bounty;
        return bounty;
      });
  }

  /**
   * Returns the utility token address.
   *
   * @return {string} utilityToken Utility token address
   */
  getUtilityToken() {
    if (this._utilityToken) {
      return Promise.resolve(this._utilityToken);
    }
    return this.contract.methods
      .utilityToken()
      .call()
      .then((utilityToken) => {
        this._utilityToken = utilityToken;
        return utilityToken;
      });
  }

  /**
   * Returns the nonce for the given account address.
   *
   * @param {string} accountAddress Account address for which the nonce is to be fetched.
   *
   * @returns {Promise} Promise object.
   */
  getNonce(accountAddress) {
    if (!Web3.utils.isAddress(accountAddress)) {
      throw new TypeError('Invalid account address.');
    }
    return this.contract.methods.getNonce(accountAddress).call();
  }

  /**
   * Returns the auxiliary chain state root provider contract address.
   *
   * @returns {Promise} Promise object.
   */
  async getStateRootProviderAddress() {
    if (this._stateRootProviderAddress) {
      return Promise.resolve(this._stateRootProviderAddress);
    }
    return this.contract.methods
      .stateRootProvider()
      .call()
      .then((stateRootProviderAddress) => {
        this._stateRootProviderAddress = stateRootProviderAddress;
        return stateRootProviderAddress;
      });
  }

  /**
   * Returns inbox message status.
   *
   * @param {string} messageHash Message hash.
   *
   * @returns {Promise} Promise object.
   */
  getInboxMessageStatus(messageHash) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }
    return this.contract.methods.getInboxMessageStatus(messageHash).call();
  }

  /**
   * Returns outbox message status.
   *
   * @param {string} messageHash Message hash.
   *
   * @returns {Promise} Promise object.
   */
  getOutboxMessageStatus(messageHash) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError('Invalid message hash.');
      return Promise.reject(err);
    }
    return this.contract.methods.getOutboxMessageStatus(messageHash).call();
  }

  /**
   * Performs redeem.
   *
   * @param {string} amount Amount to redeem.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Redeemer's nonce.
   * @param {string} hashLock Hash lock.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Object} Raw transaction object.
   */
  redeem(amount, beneficiary, gasPrice, gasLimit, nonce, hashLock, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError('Invalid redeemer address.');
      return Promise.reject(err);
    }

    return this._redeemRawTx(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    ).then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Get the raw transaction for redeem.
   *
   * @param {string} amount Amount to redeem.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Redeemer's nonce.
   * @param {string} hashLock Hash lock.
   *
   * @returns {Object} Raw transaction object.
   */
  _redeemRawTx(amount, beneficiary, gasPrice, gasLimit, nonce, hashLock) {
    if (new BN(amount).eqn(0)) {
      const err = new TypeError('Redeem amount must not be zero.');
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
    const tx = this.contract.methods.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    );
    return Promise.resolve(tx);
  }

  /**
   * Check if the account has approved CoGateway contract for redeem amount transfer.
   *
   * @param {string} redmeer Redeemer account address.
   * @param {string} amount Approval amount.
   *
   * @returns {Promise} Promise object.
   */
  isRedeemAmountApproved(redeemer, amount) {
    if (!Web3.utils.isAddress(redeemer)) {
      const err = new TypeError('Invalid redemeer address.');
      return Promise.reject(err);
    }
    return this.getEIP20UtilityToken().then((eip20ValueToken) => {
      return eip20ValueToken.isAmountApproved(
        redeemer,
        this.coGatewayAddress,
        amount,
      );
    });
  }

  /**
   * Approves CoGateway contract address for the amount transfer.
   *
   * @param {string} amount Approve amount.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  approveRedeemAmount(amount, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError('Invalid from address.');
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError('Invalid stake amount.');
      return Promise.reject(err);
    }
    return this.getEIP20UtilityToken().then((eip20Token) => {
      return eip20Token.approve(this.coGatewayAddress, amount, txOptions);
    });
  }

  /**
   * Returns Anchor object.
   *
   * @returns {Promise} Promise object.
   */
  getAnchor() {
    if (this._anchor) {
      return Promise.resolve(this._anchor);
    }
    return this.getStateRootProviderAddress().then((anchorAddress) => {
      const anchor = new Anchor(this.web3, anchorAddress);
      this._anchor = anchor;
      return anchor;
    });
  }

  /**
   * Get the state root for given block height.
   *
   * @returns {Promise} Promise object.
   */
  getLatestAnchorInfo() {
    return this.getAnchor().then((anchor) => {
      return anchor.getLatestStateRootBlockHeight().then((blockHeight) => {
        return anchor.getStateRoot(blockHeight).then((stateRoot) => {
          return {
            blockHeight,
            stateRoot,
          };
        });
      });
    });
  }

  /**
   * Returns base token object.
   *
   * @returns {Promise} Promise object.
   */
  getEIP20UtilityToken() {
    if (this._eip20UtilityToken) {
      return Promise.resolve(this._eip20UtilityToken);
    }
    return this.getUtilityToken().then((utilityToken) => {
      const token = new EIP20Token(this.web3, utilityToken);
      this._eip20UtilityToken = token;
      return token;
    });
  }
}

module.exports = EIP20CoGateway;
