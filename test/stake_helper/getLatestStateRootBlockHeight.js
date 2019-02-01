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
const sinon = require('sinon');
const Web3 = require('web3');
const StakeHelper = require('../../libs/helpers/StakeHelper');
const Contracts = require('../../libs/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('StakeHelper.getLatestStateRootBlockHeight()', () => {
  let stakeHelper;
  let originWeb3;
  let auxiliaryWeb3;
  let gatewayAddress;
  let coGatewayAddress;

  beforeEach(() => {
    // runs before each test in this block
    originWeb3 = new Web3('http://localhost:8545');
    auxiliaryWeb3 = new Web3('http://localhost:8546');
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    stakeHelper = new StakeHelper(
      originWeb3,
      auxiliaryWeb3,
      gatewayAddress,
      coGatewayAddress,
    );
  });

  it('should return correct block number', async function() {
    const expectedBlockHeight = '100';
    const stateRootProviderAddress =
      '0x0000000000000000000000000000000000000003';

    // Mock state root provider address.
    const spyGetCoGatewayStateRootProvider = sinon.replace(
      stakeHelper,
      'getCoGatewayStateRootProvider',
      sinon.fake.returns(stateRootProviderAddress),
    );

    // Mock an instance of anchor contract.
    const mockContract = sinon.mock(
      Contracts.getAnchor(auxiliaryWeb3, stateRootProviderAddress),
    );
    const anchorContract = mockContract.object;

    // Fake the getLatestStateRootBlockHeight call.
    const spyGetLatestBlockHeight = sinon.replace(
      anchorContract.methods,
      'getLatestStateRootBlockHeight',
      sinon.fake.returns(() => {
        return Promise.resolve(expectedBlockHeight);
      }),
    );

    const spyContract = sinon.replace(
      Contracts,
      'getAnchor',
      sinon.fake.returns(anchorContract),
    );

    // Add spy on stakeHelper.getLatestStateRootBlockHeight.
    const spy = sinon.spy(stakeHelper, 'getLatestStateRootBlockHeight');

    // Get auxiliary chain's state root provider contract address.
    const blockHeight = await stakeHelper.getLatestStateRootBlockHeight();

    // Assert the returned value.
    assert.strictEqual(
      blockHeight,
      expectedBlockHeight,
      'Block height from contract must not be different.',
    );

    SpyAssert.assert(spyGetCoGatewayStateRootProvider, 1, [[]]);
    SpyAssert.assert(spyGetLatestBlockHeight, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [
      [auxiliaryWeb3, stateRootProviderAddress],
    ]);
    SpyAssert.assert(spy, 1, [[]]);

    // Restore all mocked and spy objects.
    mockContract.restore();
    spy.restore();
    sinon.restore();
  });
});
