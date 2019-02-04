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
const Utils = require('../../src/utils/Utils');
const Anchor = require('../../src/ContractInteract/Anchor');

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
      const err = new TypeError(
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
    return new Promise((onResolve, onReject) => {
      if (!txOptions) {
        const err = new TypeError('Invalid transaction options.');
        onReject(err);
      }
      this._proveGatewayRawTx(blockHeight, encodedAccount, accountProof)
        .then((tx) => {
          Utils.sendTransaction(tx, txOptions)
            .then((result) => {
              onResolve(result);
            })
            .catch((exception) => {
              onReject(exception);
            });
        })
        .catch((exception) => {
          onReject(exception);
        });
    });
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
    return new Promise((onResolve, onReject) => {
      if (blockHeight === undefined) {
        const err = new TypeError('Invalid block height.');
        onReject(err);
      }

      if (typeof encodedAccount !== 'string') {
        const err = new TypeError('Invalid account data.');
        onReject(err);
      }

      if (typeof accountProof !== 'string') {
        const err = new TypeError('Invalid account proof.');
        onReject(err);
      }

      const tx = this.contract.methods.proveGateway(
        blockHeight,
        encodedAccount,
        accountProof,
      );
      onResolve(tx);
    });
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
    return new Promise((onResolve, onReject) => {
      if (!txOptions) {
        const err = new TypeError('Invalid transaction options.');
        onReject(err);
      }
      this._confirmStakeIntentRawTx(
        staker,
        nonce,
        beneficiary,
        amount,
        gasPrice,
        gasLimit,
        hashLock,
        blockHeight,
        storageProof,
      )
        .then((tx) => {
          Utils.sendTransaction(tx, txOptions)
            .then((result) => {
              onResolve(result);
            })
            .catch((exception) => {
              onReject(exception);
            });
        })
        .catch((exception) => {
          onReject(exception);
        });
    });
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
    return new Promise((onResolve, onReject) => {
      if (!Web3.utils.isAddress(staker)) {
        const err = new TypeError('Invalid staker address.');
        onReject(err);
      }

      if (typeof nonce !== 'string') {
        const err = new TypeError('Invalid nonce.');
        onReject(err);
      }

      if (!Web3.utils.isAddress(beneficiary)) {
        const err = new TypeError('Invalid beneficiary address.');
        onReject(err);
      }

      if (typeof amount !== 'string') {
        const err = new TypeError('Invalid stake amount.');
        onReject(err);
      }

      if (typeof gasPrice !== 'string') {
        const err = new TypeError('Invalid gas price.');
        onReject(err);
      }

      if (typeof gasLimit !== 'string') {
        const err = new TypeError('Invalid gas limit.');
        onReject(err);
      }

      if (typeof blockHeight !== 'string') {
        const err = new TypeError('Invalid block height.');
        onReject(err);
      }

      if (typeof storageProof !== 'string') {
        const err = new TypeError('Invalid storage proof data.');
        onReject(err);
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
      onResolve(tx);
    });
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
    return new Promise((onResolve, onReject) => {
      if (!txOptions) {
        const err = new TypeError('Invalid transaction options.');
        onReject(err);
      }
      this._progressMintRawTx(messageHash, unlockSecret)
        .then((tx) => {
          Utils.sendTransaction(tx, txOptions)
            .then((result) => {
              onResolve(result);
            })
            .catch((exception) => {
              onReject(exception);
            });
        })
        .catch((exception) => {
          onReject(exception);
        });
    });
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
    return new Promise((onResolve, onReject) => {
      if (typeof messageHash !== 'string') {
        const err = new TypeError('Invalid message hash.');
        onReject(err);
      }

      if (typeof unlockSecret !== 'string') {
        const err = new TypeError('Invalid unlock secret.');
        onReject(err);
      }

      const tx = this.contract.methods.progressMint(messageHash, unlockSecret);
      onResolve(tx);
    });
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
    return this.contract.methods
      .getNonce(accountAddress)
      .call()
      .then((nonce) => {
        return nonce;
      });
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
      throw err;
    }
    return this.contract.methods
      .getInboxMessageStatus(messageHash)
      .call()
      .then((status) => {
        return status;
      });
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
      throw err;
    }
    return this.contract.methods
      .getOutboxMessageStatus(messageHash)
      .call()
      .then((status) => {
        return status;
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
    return new Promise((onResolve, onReject) => {
      this.getAnchor().then((anchor) => {
        anchor.getLatestStateRootBlockHeight().then((blockHeight) => {
          anchor.getStateRoot(blockHeight).then((stateRoot) => {
            onResolve({
              blockHeight,
              stateRoot,
            });
          });
        });
      });
    });
  }
}

module.exports = EIP20CoGateway;
