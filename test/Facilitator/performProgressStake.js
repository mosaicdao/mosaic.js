const { assert } = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();

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
    await AssertAsync.reject(
      facilitator.performProgressStake(
        undefined,
        progressStakeParams.unlockSecret,
        progressStakeParams.txOptions,
      ),
      'Invalid message hash: undefined.',
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        undefined,
        progressStakeParams.txOptions,
      ),
      'Invalid unlock secret: undefined.',
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    await AssertAsync.reject(
      facilitator.performProgressStake(
        progressStakeParams.messageHash,
        progressStakeParams.unlockSecret,
        undefined,
      ),
      'Invalid transaction option: undefined.',
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
