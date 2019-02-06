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
const Facilitator = require('../../src/Facilitator/Facilitator');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();
const assert = chai.assert;

describe('Facilitator.performProgressUnstake()', () => {
  let mosaic;
  let facilitator;
  let progressUnstakeParams;

  let getInboxMessageStatusResult;
  let progressUnstakeResult;

  let spyGetInboxMessageStatus;
  let spyProgressUnstake;
  let spyCall;

  const setup = () => {
    spyCall = sinon.spy(facilitator, 'performProgressUnstake');
    spyGetInboxMessageStatus = sinon.replace(
      facilitator.gateway,
      'getInboxMessageStatus',
      sinon.fake.resolves(getInboxMessageStatusResult),
    );
    spyProgressUnstake = sinon.replace(
      facilitator.gateway,
      'progressUnstake',
      sinon.fake.resolves(progressUnstakeResult),
    );
  };
  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    progressUnstakeParams = {
      messageHash:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      unlockSecret:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      txOptions: {
        from: '0x0000000000000000000000000000000000000001',
        gas: '7500000',
      },
    };
    getInboxMessageStatusResult = MessageStatus.DECLARED;
    progressUnstakeResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    delete progressUnstakeParams.messageHash;
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ),
      `Invalid message hash: ${progressUnstakeParams.messageHash}.`,
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    delete progressUnstakeParams.unlockSecret;
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ),
      `Invalid unlock secret: ${progressUnstakeParams.unlockSecret}.`,
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    delete progressUnstakeParams.txOptions;
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ),
      `Invalid transaction option: ${progressUnstakeParams.txOptions}.`,
    );
  });

  it('should throw an error when inbox message status is undeclared', async () => {
    getInboxMessageStatusResult = MessageStatus.UNDECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [progressUnstakeParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressUnstake, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should throw an error when inbox message status is revocation declared', async () => {
    getInboxMessageStatusResult = MessageStatus.REVOCATION_DECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [progressUnstakeParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressUnstake, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should throw an error when inbox message status is revoked', async () => {
    getInboxMessageStatusResult = MessageStatus.REVOKED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [progressUnstakeParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressUnstake, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass with correct parameters', async () => {
    setup();
    const result = await facilitator.performProgressUnstake(
      progressUnstakeParams.messageHash,
      progressUnstakeParams.unlockSecret,
      progressUnstakeParams.txOptions,
    );
    assert.strictEqual(
      result,
      true,
      'Result of performProgressUnstake must be true',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [progressUnstakeParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressUnstake, 1, [
      [
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ],
    ]);

    teardown();
  });
});
