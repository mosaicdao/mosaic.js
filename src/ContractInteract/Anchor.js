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
    if (web3 instanceof Web3) {
      this.web3 = web3;
    } else {
      const err = new TypeError(
        "Mandatory Parameter 'web3' is missing or invalid",
      );
      throw err;
    }

    if (!Web3.utils.isAddress(anchorAddress)) {
      const err = new TypeError(
        "Mandatory Parameter 'anchorAddress' is missing or invalid.",
      );
      throw err;
    }

    this.anchorAddress = anchorAddress;

    this.contract = Contracts.getAnchor(this.web3, this.anchorAddress);

    if (!this.contract) {
      const err = new TypeError(
        `Could not load token contract for: ${this.anchorAddress}`,
      );
      throw err;
    }
  }

  /**
   * Get the state root for given block height.
   *
   * @returns {Promise} Promise object.
   */
  getStateRoot(blockHeight) {
    return this.contract.methods
      .getStateRoot(blockHeight)
      .call()
      .then((stateRoot) => {
        return stateRoot;
      });
  }

  /**
   * Get the latest committed block height.
   *
   * @returns {Promise} Promise object.
   */
  getLatestStateRootBlockHeight() {
    return this.contract.methods
      .getLatestStateRootBlockHeight()
      .call()
      .then((blockHeight) => {
        return blockHeight;
      });
  }

  /**
   * Commit state root for a block height.
   *
   * @param {string} blockHeight Block height.
   * @param {string} stateRoot Storage root.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  anchorStateRoot(blockHeight, stateRoot, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError('Invalid from address.');
      return Promise.reject(err);
    }
    const tx = this.contract.methods.anchorStateRoot(blockHeight, stateRoot);
    return Utils.sendTransaction(tx, txOptions);
  }
}

module.exports = Anchor;
