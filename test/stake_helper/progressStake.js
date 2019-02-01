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

  let messageHash;
  let unlockSecret;
  let txOption;

  let spyContract;
  let mockTx;
  let spyProgressStakeMethod;
  let spySendTransaction;
  let spyProgressStake;

  const setup = () => {
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

    // Mock progress stake transaction object.
    mockTx = sinon.mock(
      gatewayContract.methods.progressStake(messageHash, unlockSecret),
    );

    spyProgressStakeMethod = sinon.replace(
      gatewayContract.methods,
      'progressStake',
      sinon.fake.returns(mockTx.object),
    );

    spySendTransaction = sinon.replace(
      StakeHelper,
      'sendTransaction',
      sinon.fake.returns(true),
    );

    // Add spy on stakeHelper.progressStake.
    spyProgressStake = sinon.spy(stakeHelper, 'progressStake');
  };

  const tearDown = function() {
    mockTx.restore();
    spyProgressStake.restore();
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

    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    unlockSecret = '0x736563726574';

    txOption = {
      from: '0x0000000000000000000000000000000000000004',
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw error when message hash is invalid', async () => {
    const expectedErrorMessage = 'Invalid message hash.';
    await stakeHelper
      .progressStake(undefined, unlockSecret, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when unlock secret is invalid', async () => {
    const expectedErrorMessage = 'Invalid unlock secret.';
    await stakeHelper
      .progressStake(messageHash, undefined, txOption)
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
      .progressStake(messageHash, unlockSecret, undefined)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should pass with correct function arguments', async () => {
    setup();

    const result = await stakeHelper.progressStake(
      messageHash,
      unlockSecret,
      txOption,
    );

    // Assert the result/
    assert.strictEqual(result, true, 'Transaction result must be true.');

    // Assert the spy calls.
    SpyAssert.assert(spyContract, 1, [[web3, gatewayAddress]]);
    SpyAssert.assert(spyProgressStakeMethod, 1, [[messageHash, unlockSecret]]);
    SpyAssert.assert(spyProgressStake, 1, [
      [messageHash, unlockSecret, txOption],
    ]);
    SpyAssert.assert(spySendTransaction, 1, [[mockTx.object, txOption]]);

    tearDown();
  });
});
