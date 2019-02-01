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

describe('StakeHelper.confirmStakeIntent()', () => {
  let stakeHelper;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;

  let hashLockObj;
  let stakeParams = {};
  let txOption;

  let spyContract;
  let mockTx;
  let spyConfirmStakeIntentMethod;
  let spySendTransaction; // mockTx.object, txOption
  let spyConfirmStake;

  const setup = function() {
    // Mock an instance of cogateway contract.
    const mockContract = sinon.mock(
      Contracts.getEIP20CoGateway(web3, coGatewayAddress),
    );
    const coGatewayContract = mockContract.object;
    spyContract = sinon.replace(
      Contracts,
      'getEIP20CoGateway',
      sinon.fake.returns(coGatewayContract),
    );

    // Mock confirm stake intent transaction object.
    mockTx = sinon.mock(
      coGatewayContract.methods.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ),
    );

    spyConfirmStakeIntentMethod = sinon.replace(
      coGatewayContract.methods,
      'confirmStakeIntent',
      sinon.fake.returns(mockTx.object),
    );

    spySendTransaction = sinon.replace(
      StakeHelper,
      'sendTransaction',
      sinon.fake.returns(true),
    );

    // Add spy on stakeHelper.stake.
    spyConfirmStake = sinon.spy(stakeHelper, 'confirmStakeIntent');
  };

  const tearDown = function() {
    mockTx.restore();
    spyConfirmStake.restore();
    sinon.restore();
  };

  beforeEach(() => {
    // runs before each test in this block
    web3 = new Web3('http://localhost:8545');
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    stakeHelper = new StakeHelper(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress,
    );

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
      blockHeight: '12345',
      storageProof: '0x123',
    };

    txOption = {
      from: stakeParams.staker,
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw error when staker address is invalid', async () => {
    const expectedErrorMessage = 'Invalid staker address.';
    await stakeHelper
      .confirmStakeIntent(
        undefined,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
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

  it('should throw error when nonce is invalid', async () => {
    const expectedErrorMessage = 'Invalid nonce.';
    await stakeHelper
      .confirmStakeIntent(
        stakeParams.staker,
        undefined,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
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

  it('should throw error when beneficiary address is invalid', async () => {
    const expectedErrorMessage = 'Invalid beneficiary address.';
    await stakeHelper
      .confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        undefined,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
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

  it('should throw error when stake amount is invalid', async () => {
    const expectedErrorMessage = 'Invalid stake amount.';
    await stakeHelper
      .confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
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

  it('should throw error when gas price is invalid', async () => {
    const expectedErrorMessage = 'Invalid gas price.';
    await stakeHelper
      .confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        undefined,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
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

  it('should throw error when gas limit is invalid', async () => {
    const expectedErrorMessage = 'Invalid gas limit.';
    await stakeHelper
      .confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        undefined,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
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

  it('should throw error when block height is invalid', async () => {
    const expectedErrorMessage = 'Invalid block height.';
    await stakeHelper
      .confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        undefined,
        stakeParams.storageProof,
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

  it('should throw error when storage proof is invalid', async () => {
    const expectedErrorMessage = 'Invalid storage proof data.';
    await stakeHelper
      .confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        undefined,
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

  it('should throw error when transaction option is invalid', async () => {
    const expectedErrorMessage = 'Invalid transaction options.';
    await stakeHelper
      .confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
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

  it('should pass confirm stake intent', async () => {
    setup();

    const result = await stakeHelper.confirmStakeIntent(
      stakeParams.staker,
      stakeParams.nonce,
      stakeParams.beneficiary,
      stakeParams.amount,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.hashLock,
      stakeParams.blockHeight,
      stakeParams.storageProof,
      txOption,
    );

    // Assert the result/
    assert.strictEqual(result, true, 'Transaction result must be true.');

    // Assert the spy calls.
    SpyAssert.assert(spyContract, 1, [[web3, coGatewayAddress]]);
    SpyAssert.assert(spyConfirmStakeIntentMethod, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ],
    ]);
    SpyAssert.assert(spyConfirmStake, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
        txOption,
      ],
    ]);

    SpyAssert.assert(spySendTransaction, 1, [[mockTx.object, txOption]]);
    tearDown();
  });
});
