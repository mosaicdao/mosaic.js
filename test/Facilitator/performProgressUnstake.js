const { assert } = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();

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
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        undefined,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ),
      'Invalid message hash: undefined.',
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        undefined,
        progressUnstakeParams.txOptions,
      ),
      'Invalid unlock secret: undefined.',
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        undefined,
      ),
      'Invalid transaction option: undefined.',
    );
  });

  it('should throw an error when from address in transaction options is undefined', async () => {
    delete progressUnstakeParams.txOptions.from;
    await AssertAsync.reject(
      facilitator.performProgressUnstake(
        progressUnstakeParams.messageHash,
        progressUnstakeParams.unlockSecret,
        progressUnstakeParams.txOptions,
      ),
      `Invalid from address ${
        progressUnstakeParams.txOptions.from
      } in transaction options.`,
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
