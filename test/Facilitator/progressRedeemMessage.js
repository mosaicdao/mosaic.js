const { assert } = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('Facilitator.progressRedeemMessage()', () => {
  let mosaic;
  let facilitator;
  let progressRedeemMessageParams;

  let performProgressRedeemResult;
  let performProgressUnstakeResult;

  let spyPerformProgressRedeem;
  let spyPerformProgressUnstake;
  let spyCall;

  const setup = () => {
    spyPerformProgressRedeem = sinon.replace(
      facilitator,
      'performProgressRedeem',
      sinon.fake.resolves(performProgressRedeemResult),
    );
    spyPerformProgressUnstake = sinon.replace(
      facilitator,
      'performProgressUnstake',
      sinon.fake.resolves(performProgressUnstakeResult),
    );
    spyCall = sinon.spy(facilitator, 'progressRedeemMessage');
  };

  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    progressRedeemMessageParams = {
      messageHash:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      unlockSecret:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      txOptionOrigin: {
        from: '0x0000000000000000000000000000000000000001',
        gas: '7500000',
      },
      txOptionAuxiliary: {
        from: '0x0000000000000000000000000000000000000002',
        gas: '7500000',
      },
    };
    performProgressRedeemResult = true;
    performProgressUnstakeResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeemMessage(
        undefined,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
        progressRedeemMessageParams.txOptionAuxiliary,
      ),
      'Invalid message hash: undefined.',
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeemMessage(
        progressRedeemMessageParams.messageHash,
        undefined,
        progressRedeemMessageParams.txOptionOrigin,
        progressRedeemMessageParams.txOptionAuxiliary,
      ),
      'Invalid unlock secret: undefined.',
    );
  });

  it('should throw an error when origin transaction option is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeemMessage(
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        undefined,
        progressRedeemMessageParams.txOptionAuxiliary,
      ),
      'Invalid origin transaction option: undefined.',
    );
  });

  it('should throw an error when auxiliary transaction option is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeemMessage(
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
        undefined,
      ),
      'Invalid auxiliary transaction option: undefined.',
    );
  });

  it('should pass with correct params', async () => {
    setup();
    const result = await facilitator.progressRedeemMessage(
      progressRedeemMessageParams.messageHash,
      progressRedeemMessageParams.unlockSecret,
      progressRedeemMessageParams.txOptionOrigin,
      progressRedeemMessageParams.txOptionAuxiliary,
    );

    assert.deepEqual(
      result,
      [true, true],
      'Result of progressStakeMessage must be [true, true]',
    );

    SpyAssert.assert(spyPerformProgressRedeem, 1, [
      [
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
      ],
    ]);
    SpyAssert.assert(spyPerformProgressUnstake, 1, [
      [
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionAuxiliary,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
        progressRedeemMessageParams.txOptionAuxiliary,
      ],
    ]);
    teardown();
  });
});
