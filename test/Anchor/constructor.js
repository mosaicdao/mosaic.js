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
const sinon = require('sinon');

const assert = chai.assert;
const Anchor = require('../../src/ContractInteract/Anchor');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('Anchor.constructor()', () => {
  let web3;
  let anchorAddress;
  let spyContract;

  beforeEach(() => {
    web3 = new Web3();
    anchorAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should pass when called with correct arguments', async () => {
    let mockObject = sinon.fake();

    spyContract = sinon.replace(
      Contracts,
      'getAnchor',
      sinon.fake.returns(mockObject),
    );

    const contractObject = new Anchor(web3, anchorAddress);
    assert.strictEqual(
      contractObject.anchorAddress,
      anchorAddress,
      'Anchor contract address from contract must be equal to expected address',
    );
    assert.strictEqual(
      contractObject.contract,
      mockObject,
      'Contract instance must be equal to expected instance',
    );

    SpyAssert.assert(spyContract, 1, [[web3, anchorAddress]]);

    sinon.restore();
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      new Anchor(undefined, anchorAddress);
    }, /Mandatory Parameter 'web3' is missing or invalid/);
  });

  it('should throw an error when anchor contract address is undefined', async () => {
    assert.throws(() => {
      new Anchor(web3, undefined);
    }, /Mandatory Parameter 'anchorAddress' is missing or invalid./);
  });

  it('should throw error when contract instance is undefined', function() {
    spyContract = sinon.replace(
      Contracts,
      'getAnchor',
      sinon.fake.returns(undefined),
    );

    assert.throws(() => {
      new Anchor(web3, anchorAddress);
    }, `Could not load anchor contract for: ${anchorAddress}`);

    sinon.restore();
  });
});
