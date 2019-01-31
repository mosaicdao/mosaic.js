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

describe('StakeHelper.approveBountyAmount()', () => {
  let stakeHelper;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;
  let baseTokenAddress;
  let facilitatorAddress;
  let bountyAmount;
  let txOption;

  let mockBaseTokenContract;
  let mockTx;

  let spyApproveBountyAmount;
  let spyGetBounty;
  let spyGetBaseTokenAddress;
  let spyBaseTokenApprove;
  let spyContract;
  let spySendTransaction;

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

    // Mock approve transaction object.
    mockTx = sinon.mock(
      baseTokenContract.methods.approve(gatewayAddress, bountyAmount),
    );

    // Fake the approve call.
    spyBaseTokenApprove = sinon.replace(
      baseTokenContract.methods,
      'approve',
      sinon.fake.returns(mockTx.object),
    );

    spySendTransaction = sinon.replace(
      StakeHelper,
      'sendTransaction',
      sinon.fake.returns(true),
    );

    // Add spy on stakeHelper.approveBountyAmount.
    spyApproveBountyAmount = sinon.spy(stakeHelper, 'approveBountyAmount');
  };

  const tearDown = function() {
    // Restore all mocked and spy objects.
    mockBaseTokenContract.restore();
    mockTx.restore();
    spyApproveBountyAmount.restore();
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
    baseTokenAddress = '0x0000000000000000000000000000000000000003';
    facilitatorAddress = '0x0000000000000000000000000000000000000004';
    bountyAmount = 100;

    txOption = {
      from: facilitatorAddress,
      to: baseTokenAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should fail when facilitator address is invalid', async function() {
    const expectedErrorMessage = 'Invalid facilitator address.';
    txOption.from = '0x34';
    await stakeHelper.approveBountyAmount(txOption).catch((exception) => {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    });
  });

  it('should fail when transaction option is undefined', async function() {
    const expectedErrorMessage = 'Invalid transaction options.';
    await stakeHelper.approveBountyAmount().catch((exception) => {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    });
  });

  it('should approve bounty amount when called with correct params', async function() {
    setup();

    // Call approve.
    const result = await stakeHelper.approveBountyAmount(txOption);

    assert.strictEqual(
      result,
      true,
      'Approve bounty amount should return true',
    );

    SpyAssert.assert(spyApproveBountyAmount, 1, [[txOption]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyBaseTokenApprove, 1, [[gatewayAddress, bountyAmount]]);
    SpyAssert.assert(spyContract, 1, [[web3, baseTokenAddress]]);
    SpyAssert.assert(spySendTransaction, 1, [[mockTx.object, txOption]]);

    tearDown();
  });
});
