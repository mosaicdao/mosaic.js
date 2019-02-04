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
/**
 * Staker class
 */
class Staker {
  /**
   * Constructor for staker.
   *
   * @param {Object} originWeb3 Origin chain web3 object.
   * @param {string} Gateway contract address.
   */
  constructor(web3, gatewayAddress) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError('web3 must be an instance of Web3.');
    }

    if (!Web3.utils.isAddress(gatewayAddress)) {
      throw new TypeError('Invalid Gateway address.');
    }

    this.web3 = web3;
    this.gatewayAddress = gatewayAddress;
    this.gatewayContract = new EIP20Gateway(web3, gatewayAddress);

    this.approveStakeAmount = this.approveStakeAmount.bind(this);
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
