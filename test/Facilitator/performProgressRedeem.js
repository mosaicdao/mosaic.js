const chai = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();

const { assert } = chai;

describe('Facilitator.performProgressRedeem()', () => {
  let mosaic;
  let facilitator;
  let progressRedeemParams;

  let getOutboxMessageStatusResult;
  let progressRedeemResult;

  let spyGetOutboxMessageStatus;
  let spyProgressRedeem;
  let spyCall;

  const setup = () => {
    spyCall = sinon.spy(facilitator, 'performProgressRedeem');
    spyGetOutboxMessageStatus = sinon.replace(
      facilitator.coGateway,
      'getOutboxMessageStatus',
      sinon.fake.resolves(getOutboxMessageStatusResult),
    );
    spyProgressRedeem = sinon.replace(
      facilitator.coGateway,
      'progressRedeem',
      sinon.fake.resolves(progressRedeemResult),
    );
  };
  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    progressRedeemParams = {
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
    progressRedeemResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    await AssertAsync.reject(
      facilitator.performProgressRedeem(
        undefined,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ),
      `Invalid message hash: ${undefined}.`,
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    await AssertAsync.reject(
      facilitator.performProgressRedeem(
        progressRedeemParams.messageHash,
        undefined,
        progressRedeemParams.txOptions,
      ),
      `Invalid unlock secret: ${undefined}.`,
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    await AssertAsync.reject(
      facilitator.performProgressRedeem(
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        undefined,
      ),
      `Invalid transaction option: ${undefined}.`,
    );
  });

  it('should throw an error when from address in transaction options is undefined', async () => {
    delete progressRedeemParams.txOptions.from;
    await AssertAsync.reject(
      facilitator.performProgressRedeem(
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ),
      `Invalid from address ${
        progressRedeemParams.txOptions.from
      } in transaction options.`,
    );
  });

  it('should throw an error when outbox message status is undeclared', async () => {
    getOutboxMessageStatusResult = MessageStatus.UNDECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressRedeem(
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [progressRedeemParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressRedeem, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should throw an error when outbox message status is revocation declared', async () => {
    getOutboxMessageStatusResult = MessageStatus.REVOCATION_DECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressRedeem(
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [progressRedeemParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressRedeem, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should throw an error when outbox message status is revoked', async () => {
    getOutboxMessageStatusResult = MessageStatus.REVOKED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressRedeem(
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [progressRedeemParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressRedeem, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass with correct parameters', async () => {
    setup();
    const result = await facilitator.performProgressRedeem(
      progressRedeemParams.messageHash,
      progressRedeemParams.unlockSecret,
      progressRedeemParams.txOptions,
    );
    assert.strictEqual(
      result,
      true,
      'Result of performProgressRedeem must be true',
    );

    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [progressRedeemParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressRedeem, 1, [
      [
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressRedeemParams.messageHash,
        progressRedeemParams.unlockSecret,
        progressRedeemParams.txOptions,
      ],
    ]);

    teardown();
  });
});
