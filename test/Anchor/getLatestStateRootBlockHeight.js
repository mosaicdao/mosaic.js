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
const SpyAssert = require('../../test_utils/SpyAssert');

describe('Anchor.getLatestStateRootBlockHeight', () => {
  let web3;
  let anchorAddress;
  let anchor;

  beforeEach(() => {
    web3 = new Web3();
    anchorAddress = '0x0000000000000000000000000000000000000002';
    anchor = new Anchor(web3, anchorAddress);
  });

  it('should pass when called with correct arguments', async () => {
    let blockHeight = '10';

    let spyMethod = sinon.replace(
      anchor.contract.methods,
      'getLatestStateRootBlockHeight',
      sinon.fake.returns({
        call: () => Promise.resolve(blockHeight),
      }),
    );

    let result = await anchor.getLatestStateRootBlockHeight();

    assert.strictEqual(blockHeight, result, 'Block height should match');

    SpyAssert.assert(spyMethod, 1, [[]]);
  });
});
