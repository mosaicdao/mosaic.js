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

describe('StakeHelper.isStakeAmountApproved()', () => {
  let stakeHelper;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;
  let stakerAddress;
  let valueTokenAddress;
  let stakeAmount;
  let approvedAmount;

  let spyGetValueTokenAddress;
  let mockValueTokenContract;
  let spyContract;
  let spyGetAllowance;
  let spyIsStakeAmountApproved;

  const setup = function() {
    // Mock stakeHelper.getValueToken method to return expected value token address.
    spyGetValueTokenAddress = sinon.replace(
      stakeHelper,
      'getValueToken',
      sinon.fake.returns(valueTokenAddress),
    );

    // Mock an instance of Value token contract.
    mockValueTokenContract = sinon.mock(
      Contracts.getEIP20Token(web3, valueTokenAddress),
    );
    const valueTokenContract = mockValueTokenContract.object;

    spyContract = sinon.replace(
      Contracts,
      'getEIP20Token',
      sinon.fake.returns(valueTokenContract),
    );

    // Fake the allowance call.
    spyGetAllowance = sinon.replace(
      valueTokenContract.methods,
      'allowance',
      sinon.fake.returns(() => {
        return Promise.resolve(approvedAmount);
      }),
    );

    // Add spy on stakeHelper.isBountyAmountApproved.
    spyIsStakeAmountApproved = sinon.spy(stakeHelper, 'isStakeAmountApproved');
  };

  const tearDown = function() {
    // Restore all mocked and spy objects.
    mockValueTokenContract.restore();
    spyIsStakeAmountApproved.restore();
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
    stakerAddress = '0x0000000000000000000000000000000000000002';
    valueTokenAddress = '0x0000000000000000000000000000000000000003';
    stakeAmount = '1000';
    approvedAmount = '100';
  });

  it('should throw error when staker address is invalid', async function() {
    const expectedErrorMessage = 'Invalid staker address.';
    await stakeHelper
      .isStakeAmountApproved('0x123', stakeAmount)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should return false when approved amount is less than the stake amount', async function() {
    setup();
    const result = await stakeHelper.isStakeAmountApproved(
      stakerAddress,
      stakeAmount,
    );
    assert.strictEqual(result, false, 'Expected result is false.');

    SpyAssert.assert(spyGetValueTokenAddress, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [[web3, valueTokenAddress]]);
    SpyAssert.assert(spyGetAllowance, 1, [[stakerAddress, gatewayAddress]]);
    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakerAddress, stakeAmount],
    ]);

    tearDown();
  });

  it('should return true when approved amount is equal to the stake amount', async function() {
    stakeAmount = '1000';
    approvedAmount = '1000';
    setup();
    const result = await stakeHelper.isStakeAmountApproved(
      stakerAddress,
      stakeAmount,
    );
    assert.strictEqual(result, true, 'Expected result is true.');

    SpyAssert.assert(spyGetValueTokenAddress, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [[web3, valueTokenAddress]]);
    SpyAssert.assert(spyGetAllowance, 1, [[stakerAddress, gatewayAddress]]);
    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakerAddress, stakeAmount],
    ]);

    tearDown();
  });

  it('should return true when approved amount is greater than the stake amount', async function() {
    stakeAmount = '1000';
    approvedAmount = '1001';
    setup();
    const result = await stakeHelper.isStakeAmountApproved(
      stakerAddress,
      stakeAmount,
    );
    assert.strictEqual(result, true, 'Expected result is true.');

    SpyAssert.assert(spyGetValueTokenAddress, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [[web3, valueTokenAddress]]);
    SpyAssert.assert(spyGetAllowance, 1, [[stakerAddress, gatewayAddress]]);
    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakerAddress, stakeAmount],
    ]);

    tearDown();
  });
});
