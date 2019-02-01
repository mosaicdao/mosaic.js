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

const BN = require('bn.js');
const chai = require('chai');
const sinon = require('sinon');
const Web3 = require('web3');
const StakeHelper = require('../../src/helpers/StakeHelper');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('StakeHelper.stake()', () => {
  let web3;
  let gatewayAddress;
  let stakeParams = {};
  let txOption;
  let stakeHelper;

  let hashLockObj;

  let mockTx;
  let spyContract;
  let spyStakeMethod;
  let spySendTransaction;
  let spyStake;

  const setup = function() {
    // Mock an instance of gateway contract.
    const mockContract = sinon.mock(
      Contracts.getEIP20Gateway(web3, gatewayAddress),
    );
    const gatewayContract = mockContract.object;

    spyContract = sinon.replace(
      Contracts,
      'getEIP20Gateway',
      sinon.fake.returns(gatewayContract),
    );

    // Mock stake transaction object.
    mockTx = sinon.mock(
      gatewayContract.methods.stake(
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ),
    );

    spyStakeMethod = sinon.replace(
      gatewayContract.methods,
      'stake',
      sinon.fake.returns(mockTx.object),
    );

    spySendTransaction = sinon.replace(
      StakeHelper,
      'sendTransaction',
      sinon.fake.returns(true),
    );

    // Add spy on stakeHelper.stake.
    spyStake = sinon.spy(stakeHelper, 'stake');
  };

  const tearDown = function() {
    mockTx.restore();
    spyStake.restore();
    sinon.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    stakeHelper = new StakeHelper(web3, gatewayAddress);

    hashLockObj = {
      secret: 'secret',
      unlockSecret: '0x736563726574',
      hashLock:
        '0x65462b0520ef7d3df61b9992ed3bea0c56ead753be7c8b3614e0ce01e4cac41b',
    };

    stakeParams = {
      staker: '0x0000000000000000000000000000000000000005',
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: hashLockObj.hashLock,
    };

    txOption = {
      from: stakeParams.staker,
      to: gatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw error when staker address is invalid', async function() {
    const expectedErrorMessage = 'Invalid staker address.';
    await stakeHelper
      .stake(
        '0x123',
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when stake amount is zero', async function() {
    const expectedErrorMessage = 'Stake amount must not be zero.';
    await stakeHelper
      .stake(
        stakeParams.staker,
        '0',
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when beneficiary address is invalid', async function() {
    const expectedErrorMessage = 'Invalid beneficiary address.';
    await stakeHelper
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        '0x123',
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when gas price is undefined', async function() {
    const expectedErrorMessage = 'Invalid gas price.';
    await stakeHelper
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when gas limit is undefined', async function() {
    const expectedErrorMessage = 'Invalid gas limit.';
    await stakeHelper
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        undefined,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when transaction option is undefined', async function() {
    const expectedErrorMessage = 'Invalid transaction options.';
    await stakeHelper
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        undefined,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when facilitator address is invalid', async function() {
    const expectedErrorMessage = 'Invalid facilitator address.';
    txOption.from = '0x233';
    await stakeHelper
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should pass when all the function arguments are correct', async function() {
    setup();

    const result = await stakeHelper.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.nonce,
      stakeParams.hashLock,
      txOption,
    );

    // Assert the result/
    assert.strictEqual(result, true, 'Transaction result must be true.');

    // Assert the spy calls.
    SpyAssert.assert(spyContract, 1, [[web3, gatewayAddress]]);
    SpyAssert.assert(spyStakeMethod, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ],
    ]);
    SpyAssert.assert(spyStake, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOption,
      ],
    ]);
    SpyAssert.assert(spySendTransaction, 1, [[mockTx.object, txOption]]);

    tearDown();
  });
});
