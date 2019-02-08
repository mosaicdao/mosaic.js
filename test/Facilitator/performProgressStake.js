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
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();
const assert = chai.assert;

describe('Facilitator.performProgressStake()', () => {
  let mosaic;
  let facilitator;
  let progressStakeParams;

  let getOutboxMessageStatusResult;
  let progressStakeResult;

  let spyGetOutboxMessageStatus;
  let spyProgressStake;
  let spyCall;

  const setup = () => {
    spyCall = sinon.spy(facilitator, 'performProgressStake');
    spyGetOutboxMessageStatus = sinon.replace(
      facilitator.gateway,
      'getOutboxMessageStatus',
      sinon.fake.resolves(getOutboxMessageStatusResult),
    );
    spyProgressStake = sinon.replace(
      facilitator.gateway,
      'progressStake',
      sinon.fake.resolves(progressStakeResult),
    );
  };
  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    progressStakeParams = {
      messageHash:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      unlockSecret:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      txOptions: {
        from: '0x0000000000000000000000000000000000000001',
        gas: '7500000',
      },
    };
    getOutboxMessageStatusResult = MessageStatus.DECLARED;
    progressStakeResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    delete progressStakeParams.messageHash;
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ),
      `Invalid message hash: ${progressStakeParams.messageHash}.`,
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    delete progressStakeParams.unlockSecret;
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ),
      `Invalid unlock secret: ${progressStakeParams.unlockSecret}.`,
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    delete progressStakeParams.txOptions;
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ),
      `Invalid transaction option: ${progressStakeParams.txOptions}.`,
    );
  });

  it('should throw an error when from address in transaction options is undefined', async () => {
    delete progressStakeParams.txOptions.from;
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ),
      `Invalid from address ${
        progressStakeParams.txOptions.from
      } in transaction options.`,
    );
  });

  it('should throw an error when outbox message status is undeclared', async () => {
    getOutboxMessageStatusResult = MessageStatus.UNDECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [progressStakeParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressStake, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should throw an error when outbox message status is revocation declared', async () => {
    getOutboxMessageStatusResult = MessageStatus.REVOCATION_DECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [progressStakeParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressStake, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should throw an error when outbox message status is revoked', async () => {
    getOutboxMessageStatusResult = MessageStatus.REVOKED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [progressStakeParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressStake, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass with correct parameters', async () => {
    setup();
    const result = await facilitator.performProgressStake(
      progressStakeParams.messageHash,
      progressStakeParams.unlockSecret,
      progressStakeParams.txOptions,
    );
    assert.strictEqual(
      result,
      true,
      'Result of perfromProgressStake must be true',
    );

    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [progressStakeParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressStake, 1, [
      [
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ],
    ]);

    teardown();
  });
});
