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
const SpyAssert = require('../../test_utils/SpyAssert');
const Facilitator = require('../../src/Facilitator/Facilitator');

const assert = chai.assert;

describe('facilitator.performProgress()', () => {
  let facilitator;
  let web3;

  let messageHash;
  let unlockSecret;
  let txOptionOrigin;
  let txOptionAuxiliary;

  let performProgressStakeResult;
  let performProgressMintResult;

  let spyPerformProgressStake;
  let spyPerformProgressMint;
  let spyPerformProgress;

  const setup = () => {
    // Mock facilitator.performProgressStake
    spyPerformProgressStake = sinon.replace(
      facilitator,
      'performProgressStake',
      sinon.fake.resolves(performProgressStakeResult),
    );

    // Mock facilitator.performProgressMint
    spyPerformProgressMint = sinon.replace(
      facilitator,
      'performProgressMint',
      sinon.fake.resolves(performProgressMintResult),
    );

    spyPerformProgress = sinon.spy(facilitator, 'performProgress');
  };
  const tearDown = () => {
    sinon.restore();
    spyPerformProgress.restore();
  };

  beforeEach(() => {
    // runs before each test in this block
    const gatewayAddress = '0x0000000000000000000000000000000000000001';
    const coGatewayAddress = '0x0000000000000000000000000000000000000002';
    web3 = new Web3();
    facilitator = new Facilitator(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress,
    );
    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    unlockSecret = '0x000000000111';
    txOptionOrigin = {
      from: '0x0000000000000000000000000000000000000010',
      to: gatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
    txOptionAuxiliary = {
      from: '0x0000000000000000000000000000000000000020',
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
    performProgressStakeResult = true;
    performProgressMintResult = true;
  });

  it('should throw error when message hash is invalid', async () => {
    const expectedErrorMessage = 'Invalid message hash.';
    await facilitator
      .performProgress(
        undefined,
        unlockSecret,
        txOptionOrigin,
        txOptionAuxiliary,
      )
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
    await facilitator
      .performProgress(
        messageHash,
        undefined,
        txOptionOrigin,
        txOptionAuxiliary,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when origin transaction option is invalid', async () => {
    const expectedErrorMessage = 'Invalid origin transaction option.';
    await facilitator
      .performProgress(messageHash, unlockSecret, undefined, txOptionAuxiliary)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when auxiliary transaction option is invalid', async () => {
    const expectedErrorMessage = 'Invalid auxiliary transaction option.';
    await facilitator
      .performProgress(messageHash, unlockSecret, txOptionOrigin, undefined)
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
    const result = await facilitator.performProgress(
      messageHash,
      unlockSecret,
      txOptionOrigin,
      txOptionAuxiliary,
    );
    SpyAssert.assert(spyPerformProgressStake, 1, [
      [messageHash, unlockSecret, txOptionOrigin],
    ]);
    SpyAssert.assert(spyPerformProgressMint, 1, [
      [messageHash, unlockSecret, txOptionAuxiliary],
    ]);
    SpyAssert.assert(spyPerformProgress, 1, [
      [messageHash, unlockSecret, txOptionOrigin, txOptionAuxiliary],
    ]);
    tearDown();
  });
});
