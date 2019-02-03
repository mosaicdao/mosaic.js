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

const chai = require('chai');
const Web3 = require('web3');

const Chain = require('../src/Chain');

const { assert } = chai;

describe('Chain', () => {
  // This is not used to actually make calls, only to assert correct parameters.
  const web3Provider = 'http://localhost:8545';
  const web3 = new Web3(web3Provider);

  const contractAddresses = {
    Anchor: 'anchor',
    Token: 'token',
  };

  it('sets the correct parameters', () => {
    const chain = new Chain(web3, contractAddresses);

    assert.deepEqual(
      web3,
      chain.web3,
      'Chain did not set the correct web3 parameter on construction.',
    );
    assert.deepEqual(
      contractAddresses,
      chain.contractAddresses,
      'Chain did not set the correct contract addresses parameter on construction.',
    );
  });

  it('makes the parameters read-only', () => {
    const chain = new Chain(web3, contractAddresses);

    assert.throws(() => {
      chain.web3 = new Web3(web3Provider);
    }, /Cannot assign to read only property/);
    assert.throws(() => {
      chain.contractAddresses = {};
    }, /Cannot assign to read only property/);
  });

  it('checks for the correct argument types', () => {
    assert.throws(
      () => new Chain({}, contractAddresses),
      'web3 must be an instance of Web3.',
    );
  });
});
