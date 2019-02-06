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
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');
const Anchor = require('../ContractInteract/Anchor');

/**
 * Contract interact for EIP20CoGateway.
 */
class EIP20CoGateway {
  /**
   * Constructor for EIP20CoGateway.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} coGatewayAddress EIP20CoGateway contract address.
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
        `Could not load EIP20CoGateway contract for: ${this.coGatewayAddress}`,
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
}

module.exports = EIP20CoGateway;
