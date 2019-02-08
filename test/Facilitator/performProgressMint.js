const chai = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();

const { assert } = chai;

describe('Facilitator.performProgressMint()', () => {
  let mosaic;
  let facilitator;
  let progressMintParams;

  let getInboxMessageStatusResult;
  let progressMintResult;

  let spyGetInboxMessageStatus;
  let spyProgressMint;
  let spyCall;

  const setup = () => {
    spyCall = sinon.spy(facilitator, 'performProgressMint');
    spyGetInboxMessageStatus = sinon.replace(
      facilitator.coGateway,
      'getInboxMessageStatus',
      sinon.fake.resolves(getInboxMessageStatusResult),
    );
    spyProgressMint = sinon.replace(
      facilitator.coGateway,
      'progressMint',
      sinon.fake.resolves(progressMintResult),
    );
  };
  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    progressMintParams = {
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
    progressMintResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    delete progressMintParams.messageHash;
    await AssertAsync.reject(
      facilitator.performProgressMint(
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ),
      `Invalid message hash: ${progressMintParams.messageHash}.`,
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    delete progressMintParams.unlockSecret;
    await AssertAsync.reject(
      facilitator.performProgressMint(
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ),
      `Invalid unlock secret: ${progressMintParams.unlockSecret}.`,
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    delete progressMintParams.txOptions;
    await AssertAsync.reject(
      facilitator.performProgressMint(
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ),
      `Invalid transaction option: ${progressMintParams.txOptions}.`,
    );
  });

  it('should throw an error when from address in transaction options is undefined', async () => {
    delete progressMintParams.txOptions.from;
    await AssertAsync.reject(
      facilitator.performProgressMint(
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ),
      `Invalid from address ${
        progressMintParams.txOptions.from
      } in transaction options.`,
    );
  });

  it('should throw an error when inbox message status is undeclared', async () => {
    getInboxMessageStatusResult = MessageStatus.UNDECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressMint(
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [progressMintParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressMint, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should throw an error when inbox message status is revocation declared', async () => {
    getInboxMessageStatusResult = MessageStatus.REVOCATION_DECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressMint(
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [progressMintParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressMint, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should throw an error when inbox message status is revoked', async () => {
    getInboxMessageStatusResult = MessageStatus.REVOKED;
    setup();
    await AssertAsync.reject(
      facilitator.performProgressMint(
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ),
      'Message cannot be progressed.',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [progressMintParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressMint, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass with correct parameters', async () => {
    setup();
    const result = await facilitator.performProgressMint(
      progressMintParams.messageHash,
      progressMintParams.unlockSecret,
      progressMintParams.txOptions,
    );
    assert.strictEqual(
      result,
      true,
      'Result of performProgressMint must be true',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [progressMintParams.messageHash],
    ]);
    SpyAssert.assert(spyProgressMint, 1, [
      [
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressMintParams.messageHash,
        progressMintParams.unlockSecret,
        progressMintParams.txOptions,
      ],
    ]);

    teardown();
  });
});
