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
const Message = require('../../src/utils/Message');

const messageStatus = Message.messageStatus();
const assert = chai.assert;

describe('facilitator.performProgressMint()', () => {
  let facilitator;
  let web3;

  let messageHash;
  let unlockSecret;
  let txOption;

  let mintStatus;

  let spyGetMintStatus;
  let spyStakeHelperProgressMint;
  let spyPerformProgressMint;

  const setup = () => {
    // Mock facilitator.stakeHelper.getMintStatus
    spyGetMintStatus = sinon.replace(
      facilitator.stakeHelper,
      'getMintStatus',
      sinon.fake.resolves(mintStatus),
    );

    // Mock facilitator.stakeHelper.progressMint
    spyStakeHelperProgressMint = sinon.replace(
      facilitator.stakeHelper,
      'progressMint',
      sinon.fake.resolves(true),
    );

    spyPerformProgressMint = sinon.spy(facilitator, 'performProgressMint');
  };
  const tearDown = () => {
    sinon.restore();
    spyPerformProgressMint.restore();
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
    txOption = {
      from: '0x0000000000000000000000000000000000000020',
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
    mintStatus = messageStatus.DECLARED;
  });

  it('should throw error when message hash is invalid', async () => {
    const expectedErrorMessage = 'Invalid message hash.';
    await facilitator
      .performProgressMint(undefined, unlockSecret, txOption)
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
      .performProgressMint(messageHash, undefined, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when transaction option is invalid', async () => {
    const expectedErrorMessage = 'Invalid transaction option.';
    await facilitator
      .performProgressMint(messageHash, unlockSecret, undefined)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error mint status is undeclared', async () => {
    mintStatus = messageStatus.UNDECLARED;
    setup();
    const expectedErrorMessage = 'Mint status must be declared.';
    await facilitator
      .performProgressMint(messageHash, unlockSecret, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
        tearDown();
      });
  });

  it('should throw error mint status is revoked', async () => {
    mintStatus = messageStatus.REVOKED;
    setup();
    const expectedErrorMessage = 'Mint status must be declared.';
    await facilitator
      .performProgressMint(messageHash, unlockSecret, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
        tearDown();
      });
  });

  it('should throw error mint status is revocation declared', async () => {
    mintStatus = messageStatus.REVOCATION_DECLARED;
    setup();
    const expectedErrorMessage = 'Mint status must be declared.';
    await facilitator
      .performProgressMint(messageHash, unlockSecret, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
        tearDown();
      });
  });

  it('should pass when mint status is declared', async () => {
    mintStatus = messageStatus.DECLARED;
    setup();
    const result = await facilitator.performProgressMint(
      messageHash,
      unlockSecret,
      txOption,
    );
    assert.strictEqual(result, true, 'Result should be true');
    SpyAssert.assert(spyGetMintStatus, 1, [[messageHash]]);
    SpyAssert.assert(spyStakeHelperProgressMint, 1, [
      [messageHash, unlockSecret, txOption],
    ]);
    SpyAssert.assert(spyPerformProgressMint, 1, [
      [messageHash, unlockSecret, txOption],
    ]);
    tearDown();
  });

  it('should pass when mint status is progressed', async () => {
    mintStatus = messageStatus.PROGRESSED;
    setup();
    const result = await facilitator.performProgressMint(
      messageHash,
      unlockSecret,
      txOption,
    );
    assert.strictEqual(result, true, 'Result should be true');
    SpyAssert.assert(spyGetMintStatus, 1, [[messageHash]]);
    SpyAssert.assert(spyStakeHelperProgressMint, 0);
    SpyAssert.assert(spyPerformProgressMint, 1, [
      [messageHash, unlockSecret, txOption],
    ]);
    tearDown();
  });
});
