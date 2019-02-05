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

const chai = require('chai');
const Web3 = require('web3');
const Chain = require('../src/Chain');
const Mosaic = require('../src/Mosaic');

const assert = chai.assert;

/**
 * This class returns Mosaic object used for unit testing.
 */
class GetTestMosaic {
  static mosaic() {
    const originContractAddresses = {
      EIP20Gateway: '0x0000000000000000000000000000000000001111',
    };
    const auxiliaryContractAddresses = {
      EIP20CoGateway: '0x0000000000000000000000000000000000002222',
    };
    const originWeb3Provider = 'http://localhost:8545';
    const originWeb3 = new Web3(originWeb3Provider);
    const originChain = new Chain(originWeb3, originContractAddresses);
    const auxiliaryWeb3Provider = 'http://localhost:8546';
    const auxiliaryWeb3 = new Web3(auxiliaryWeb3Provider);
    const auxiliaryChain = new Chain(
      auxiliaryWeb3,
      auxiliaryContractAddresses,
    );
    const mosaic = new Mosaic(originChain, auxiliaryChain);
    return mosaic;
  }
}

module.exports = GetTestMosaic;
