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

const BN = require('bn.js');
const Web3 = require('web3');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');

/**
 * Contract interact for EIP20Token contract.
 */
class EIP20Token {
  /**
   * Constructor for EIP20Gateway.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} tokenAddress EIP20Token contract address.
   */
  constructor(web3, tokenAddress) {
    if (web3 instanceof Web3) {
      this.web3 = web3;
    } else {
      const err = new TypeError(
        "Mandatory Parameter 'web3' is missing or invalid",
      );
      throw err;
    }

    if (!Web3.utils.isAddress(tokenAddress)) {
      const err = new TypeError(
        "Mandatory Parameter 'tokenAddress' is missing or invalid.",
      );
      throw err;
    }

    this.tokenAddress = tokenAddress;

    this.contract = Contracts.getEIP20Token(this.web3, this.tokenAddress);

    if (!this.contract) {
      const err = new Error(
        `Could not load token contract for: ${this.tokenAddress}`,
      );
      throw err;
    }

    this.approve = this.approve.bind(this);
    this._approveRawTx = this._approveRawTx.bind(this);
    this.allowance = this.allowance.bind(this);
    this.isAmountApproved = this.isAmountApproved.bind(this);
  }

  /**
   * Approves account address for the amount transfer.
   *
   * @param {string} spenderAddress Spender account address.
   * @param {string} amount Approve amount.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  approve(spenderAddress, amount, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError('Invalid from address.');
      return Promise.reject(err);
    }
    return this._approveRawTx(spenderAddress, amount).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get raw transaction object for aprove amount.
   *
   * @param {string} spenderAddress Spender address.
   * @param {string} amount Approve amount.
   *
   * @returns {Promise} Promise object.
   */
  _approveRawTx(spenderAddress, amount) {
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError('Invalid spender address.');
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError('Invalid approval amount.');
      return Promise.reject(err);
    }
    const tx = this.contract.methods.approve(spenderAddress, amount);
    return Promise.resolve(tx);
  }

  /**
   * Returns the allowance amount for the given account address
   *
   * @param {string} ownerAddress Owner account address.
   * @param {string} spenderAddress Spender account address.
   *
   * @returns {Promise} Promise object.
   */
  allowance(ownerAddress, spenderAddress) {
    if (!Web3.utils.isAddress(ownerAddress)) {
      const err = new TypeError('Owner address is invalid or missing');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError('Spender address is invalid or missing');
      return Promise.reject(err);
    }
    return this.contract.methods
      .allowance(ownerAddress, spenderAddress)
      .call()
      .then((allowance) => {
        return allowance;
      });
  }

  /**
   * Check if the account has approved gateway contract.
   *
   * @param {string} ownerAddress Owner account address.
   * @param {string} spenderAddress Spender account address.
   * @param {string} amount Approval amount.
   *
   * @returns {bool} `true` if approved.
   */
  isAmountApproved(ownerAddress, spenderAddress, amount) {
    if (!Web3.utils.isAddress(ownerAddress)) {
      const err = new TypeError('Invalid owner address.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError('Invalid spender address.');
      return Promise.reject(err);
    }
    return this.allowance(ownerAddress, spenderAddress).then(
      (approvedAllowance) => {
        return new BN(amount).lte(new BN(approvedAllowance));
      },
    );
  }
}

module.exports = EIP20Token;
