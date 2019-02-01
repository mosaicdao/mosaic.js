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
const StakeHelper = require('../../src/helpers/StakeHelper');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('StakeHelper.isBountyAmountApproved()', () => {
  let stakeHelper;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;
  let accountAddress;
  let baseTokenAddress;
  let bountyAmount;
  let approvedAmount;

  let spyGetBaseTokenAddress;
  let spyGetBounty;
  let mockBaseTokenContract;
  let spyContract;
  let spyGetAllowance;
  let spyIsBountyAmountApproved;

  const setup = function() {
    // Mock stakeHelper.getBaseToken method to return expected base token address.
    spyGetBaseTokenAddress = sinon.replace(
      stakeHelper,
      'getBaseToken',
      sinon.fake.returns(baseTokenAddress),
    );

    // Mock stakeHelper.getBounty method to return expected bounty amount.
    spyGetBounty = sinon.replace(
      stakeHelper,
      'getBounty',
      sinon.fake.returns(bountyAmount),
    );

    // Mock an instance of BaseToken contract.
    mockBaseTokenContract = sinon.mock(
      Contracts.getEIP20Token(web3, baseTokenAddress),
    );
    const baseTokenContract = mockBaseTokenContract.object;

    spyContract = sinon.replace(
      Contracts,
      'getEIP20Token',
      sinon.fake.returns(baseTokenContract),
    );

    // Fake the allowance call.
    spyGetAllowance = sinon.replace(
      baseTokenContract.methods,
      'allowance',
      sinon.fake.returns(() => {
        return Promise.resolve(approvedAmount);
      }),
    );

    // Add spy on stakeHelper.isBountyAmountApproved.
    spyIsBountyAmountApproved = sinon.spy(
      stakeHelper,
      'isBountyAmountApproved',
    );
  };

  const tearDown = function() {
    // Restore all mocked and spy objects.
    mockBaseTokenContract.restore();
    spyIsBountyAmountApproved.restore();
    sinon.restore();
  };

  beforeEach(() => {
    // runs before each test in this block
    web3 = new Web3('http://localhost:8545');
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    coGatewayAddress = '0x0000000000000000000000000000000000000012';
    stakeHelper = new StakeHelper(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress,
    );
    accountAddress = '0x0000000000000000000000000000000000000002';
    baseTokenAddress = '0x0000000000000000000000000000000000000003';
    bountyAmount = '1000';
    approvedAmount = '100';
  });

  it('should throw error when facilitator address is invalid', async function() {
    const expectedErrorMessage = 'Invalid facilitator address.';
    await stakeHelper.isBountyAmountApproved('0x123').catch((exception) => {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    });
  });

  it('should return false when approved amount is less than the bounty amount', async function() {
    setup();
    const result = await stakeHelper.isBountyAmountApproved(accountAddress);
    assert.strictEqual(result, false, 'Expected result is false.');

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [[web3, baseTokenAddress]]);
    SpyAssert.assert(spyGetAllowance, 1, [[accountAddress, gatewayAddress]]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[accountAddress]]);

    tearDown();
  });

  it('should return true when approved amount is equal to the bounty amount', async function() {
    bountyAmount = '1000';
    approvedAmount = '1000';
    setup();
    const result = await stakeHelper.isBountyAmountApproved(accountAddress);
    assert.strictEqual(result, true, 'Expected result is true.');

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [[web3, baseTokenAddress]]);
    SpyAssert.assert(spyGetAllowance, 1, [[accountAddress, gatewayAddress]]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[accountAddress]]);

    tearDown();
  });

  it('should return true when approved amount is greater than the bounty amount', async function() {
    bountyAmount = '1000';
    approvedAmount = '1001';
    setup();
    const result = await stakeHelper.isBountyAmountApproved(accountAddress);
    assert.strictEqual(result, true, 'Expected result is true.');

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [[web3, baseTokenAddress]]);
    SpyAssert.assert(spyGetAllowance, 1, [[accountAddress, gatewayAddress]]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[accountAddress]]);

    tearDown();
  });
});
