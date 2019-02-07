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

/**
 * Contract interact for Anchor contract.
 */
class Anchor {
  /**
   * Constructor for Anchor.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} anchorAddress Anchor contract address.
   */
  constructor(web3, anchorAddress) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(anchorAddress)) {
      throw new TypeError(
        "Mandatory Parameter 'anchorAddress' is missing or invalid.",
      );
    }

    this.web3 = web3;
    this.anchorAddress = anchorAddress;

    this.contract = Contracts.getAnchor(this.web3, this.anchorAddress);

    if (!this.contract) {
      throw new TypeError(
        `Could not load anchor contract for: ${this.anchorAddress}`,
      );
    }

    this.getStateRoot = this.getStateRoot.bind(this);
    this.getLatestStateRootBlockHeight = this.getLatestStateRootBlockHeight.bind(
      this,
    );
    this.anchorStateRoot = this.anchorStateRoot.bind(this);
  }

  /**
   * Get the state root for given block height.
   *
   * @param {string} blockHeight Block height.
   * @returns {Promise<string>} Promise that resolves to state root.
   */
  getStateRoot(blockHeight) {
    if (typeof blockHeight !== 'string') {
      const err = new TypeError(`Invalid block height: ${blockHeight}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.getStateRoot(blockHeight).call();
  }

  /**
   * Get the latest committed block height.
   *
   * @returns {Promise<string>} Promise that resolves to block height.
   */
  getLatestStateRootBlockHeight() {
    return this.contract.methods.getLatestStateRootBlockHeight().call();
  }

  /**
   * Commit state root for a block height.
   *
   * @param {string} blockHeight Block height.
   * @param {string} stateRoot Storage root.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  anchorStateRoot(blockHeight, stateRoot, txOptions) {
    if (typeof blockHeight !== 'string') {
      const err = new TypeError(`Invalid block height: ${blockHeight}.`);
      return Promise.reject(err);
    }
    if (typeof stateRoot !== 'string') {
      const err = new TypeError(`Invalid state root: ${stateRoot}.`);
      return Promise.reject(err);
    }
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    const tx = this.contract.methods.anchorStateRoot(blockHeight, stateRoot);
    return Utils.sendTransaction(tx, txOptions);
  }
}

module.exports = Anchor;
