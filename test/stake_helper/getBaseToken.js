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

describe('StakeHelper.getBaseToken()', () => {
  let stakeHelper;
  let web3;
  let gatewayAddress;

  beforeEach(() => {
    // runs before each test in this block
    web3 = new Web3('http://localhost:8545');
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    stakeHelper = new StakeHelper(web3, gatewayAddress);
  });

  it('should return correct base token', async function() {
    const expectedBaseTokenAddress =
      '0x0000000000000000000000000000000000000003';

    // Mock an instance of gateway contract.
    const mockContract = sinon.mock(
      Contracts.getEIP20Gateway(web3, gatewayAddress),
    );
    const gatewayContract = mockContract.object;

    // Fake the base token call.
    const spyBaseToken = sinon.replace(
      gatewayContract.methods,
      'baseToken',
      sinon.fake.returns(() => {
        return Promise.resolve(expectedBaseTokenAddress);
      }),
    );

    const spyContract = sinon.replace(
      Contracts,
      'getEIP20Gateway',
      sinon.fake.returns(gatewayContract),
    );

    // Add spy on stakeHelper.getBaseToken.
    const spy = sinon.spy(stakeHelper, 'getBaseToken');

    // Get base token address.
    const baseToken = await stakeHelper.getBaseToken();

    // Assert the returned value.
    assert.strictEqual(
      baseToken,
      expectedBaseTokenAddress,
      'Base token address must not be different.',
    );

    SpyAssert.assert(spyBaseToken, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [[web3, gatewayAddress]]);
    SpyAssert.assert(spy, 1, [[]]);

    // Restore all mocked and spy objects.
    mockContract.restore();
    spy.restore();
    sinon.restore();
  });
});
