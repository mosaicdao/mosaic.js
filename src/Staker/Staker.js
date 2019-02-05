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

const Web3 = require('web3');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const Mosaic = require('../Mosaic');

/**
 * Staker class
 */
class Staker {
  /**
   * Constructor for staker.
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
    if (!Web3.utils.isAddress(mosaic.origin.contractAddresses.EIP20Gateway)) {
      const err = new TypeError('Invalid EIP20Gateway address.');
      throw err;
    }

    this.web3 = mosaic.origin.web3;
    this.gatewayAddress = mosaic.origin.contractAddresses.EIP20Gateway;
    this.gatewayContract = new EIP20Gateway(this.web3, this.gatewayAddress);

    this.approveStakeAmount = this.approveStakeAmount.bind(this);
    this.getValueToken = this.getValueToken.bind(this);
  }

  /**
   * Approve gateway contract for token transfer.
   *
   * @param {string} amount Stake amount
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  approveStakeAmount(amount, txOptions) {
    if (typeof amount !== 'string') {
      const err = new Error('Invalid stake amount.');
      throw err;
    }
    if (!txOptions) {
      const err = new Error('Invalid transaction options.');
      throw err;
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new Error('Invalid staker address.');
      throw err;
    }

    // Get value token address.
    let approvalChain = this.gatewayContract.getValueToken();

    // Create an instance of value token
    approvalChain = approvalChain.then((valueTokenAddress) =>
      this.getValueToken(valueTokenAddress),
    );

    // Call approve on value token.
    approvalChain = approvalChain.then((valueToken) =>
      valueToken.approve(this.gatewayAddress, amount, txOptions),
    );

    return approvalChain;
  }

  getValueToken(tokenAddress) {
    return new EIP20Token(this.web3, tokenAddress);
  }
}

module.exports = Staker;
