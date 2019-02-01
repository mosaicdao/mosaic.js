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

/**
 * Chain stores a web3 instance to access a chain as well as the addresses of the required
 * contracts.
 * @param {Web3} web3 A web3 instance with a provider to access this chain.
 * @param {Object} contractAddresses Contract addresses, indexed by identifier, e.g. Anchor or
 */
class Chain {
  /**
   * Creates a new Chain instance.
   * @param {Web3} web3 A web3 instance with a provider to access this chain.
   * @param {Object} contractAddresses Contract addresses, indexed by identifier, e.g. Anchor or
   *                                   Token.
   */
  constructor(web3, contractAddresses) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError('web3 must be an instance of Web3.');
    }

    const chainPropertyConfiguration = {
      configurable: false,
      enumerable: true,
      writable: false,
    };

    Object.defineProperties(this, {
      web3: {
        value: web3,
        ...chainPropertyConfiguration,
      },
      contractAddresses: {
        value: contractAddresses,
        ...chainPropertyConfiguration,
      },
    });
  }
}

module.exports = Chain;
