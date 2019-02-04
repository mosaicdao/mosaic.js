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
const Utils = require('../../src/utils/Utils');

const assert = chai.assert;

describe('StakeHelper.approveStakeAmount()', () => {
  let stakeHelper;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;
  let valueTokenAddress;
  let stakerAddress;
  let stakeAmount;
  let txOption;

  let mockValueTokenContract;
  let mockTx;

  let spyApproveStakeAmount;
  let spyGetValueToken;
  let spyContract;
  let spySendTransaction;
  let spyValueTokenApprove;

  const setup = function() {
    // Mock stakeHelper.getValueToken method to return expected value token address.
    spyGetValueToken = sinon.replace(
      stakeHelper,
      'getValueToken',
      sinon.fake.resolves(valueTokenAddress),
    );

    // Mock an instance of ValueToken contract.
    mockValueTokenContract = sinon.mock(
      Contracts.getEIP20Token(web3, valueTokenAddress),
    );
    const valueTokenContract = mockValueTokenContract.object;

    spyContract = sinon.replace(
      Contracts,
      'getEIP20Token',
      sinon.fake.returns(valueTokenContract),
    );

    // Mock approve transaction object.
    mockTx = sinon.mock(
      valueTokenContract.methods.approve(gatewayAddress, stakeAmount),
    );

    // Fake the approve call.
    spyValueTokenApprove = sinon.replace(
      valueTokenContract.methods,
      'approve',
      sinon.fake.resolves(mockTx.object),
    );

    spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );

    // Add spy on stakeHelper.approveStakeAmount.
    spyApproveStakeAmount = sinon.spy(stakeHelper, 'approveStakeAmount');
  };

  const tearDown = function() {
    // Restore all mocked and spy objects.
    mockValueTokenContract.restore();
    mockTx.restore();
    spyApproveStakeAmount.restore();
    sinon.restore();
  };

  beforeEach(() => {
    // runs before each test in this block
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    stakeHelper = new StakeHelper(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress,
    );

    valueTokenAddress = '0x0000000000000000000000000000000000000003';
    stakerAddress = '0x0000000000000000000000000000000000000004';
    stakeAmount = 100;

    txOption = {
      from: stakerAddress,
      to: valueTokenAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should fail when staker address is invalid', async function() {
    txOption.from = '0x123';
    const expectedErrorMessage = 'Invalid staker address.';
    await stakeHelper
      .approveStakeAmount(stakeAmount, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should fail when transaction option is undefined', async function() {
    const expectedErrorMessage = 'Invalid transaction options.';
    await stakeHelper.approveStakeAmount(stakeAmount).catch((exception) => {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    });
  });

  it('should approve stake amount with default gas value', async function() {
    setup();

    // Call approve.
    const result = await stakeHelper.approveStakeAmount(stakeAmount, txOption);

    assert.strictEqual(
      result,
      true,
      'Approve bounty amount should return true',
    );

    SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeAmount, txOption]]);
    SpyAssert.assert(spyGetValueToken, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [[web3, valueTokenAddress]]);
    SpyAssert.assert(spySendTransaction, 1, [[mockTx.object, txOption]]);
    SpyAssert.assert(spyValueTokenApprove, 1, [[gatewayAddress, stakeAmount]]);

    tearDown();
  });
});
