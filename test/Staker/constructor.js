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

const assert = chai.assert;
const Staker = require('../../src/Staker/Staker');

describe('Staker.constructor()', () => {
  let web3;
  let gatewayAddress;

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      new Staker(undefined, gatewayAddress);
    }, /web3 must be an instance of Web3./);
  });

  it('should throw an error when gateway contract address is undefined', async () => {
    assert.throws(() => {
      new Staker(web3, undefined);
    }, /Invalid Gateway address./);
  });

  it('should pass when called with correct arguments', async () => {
    const staker = new Staker(web3, gatewayAddress);
    assert.strictEqual(staker.web3, web3, 'Web3 object is not set.');
    assert.strictEqual(
      staker.gatewayAddress,
      gatewayAddress,
      'Gateway address is not set',
    );
  });
});
