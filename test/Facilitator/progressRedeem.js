'use strict';

const { assert } = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

describe('Facilitator.progressRedeem()', () => {
  let mosaic;
  let redeemParams;
  let txOptionsOrigin;
  let txOptionsAuxiliary;
  let facilitator;

  let confirmRedeemIntentResult;
  let progressRedeemMessageResult;
  let getMessageHashResult;

  let spyConfirmRedeemIntent;
  let spyProgressRedeemMessage;
  let spyGetMesageHash;
  let spyCall;

  const setup = () => {
    spyConfirmRedeemIntent = sinon.replace(
      facilitator,
      'confirmRedeemIntent',
      sinon.fake.resolves(confirmRedeemIntentResult),
    );
    spyProgressRedeemMessage = sinon.replace(
      facilitator,
      'progressRedeemMessage',
      sinon.fake.resolves(progressRedeemMessageResult),
    );
    spyGetMesageHash = sinon.replace(
      Message,
      'getRedeemMessageHash',
      sinon.fake.returns(getMessageHashResult),
    );
    spyCall = sinon.spy(facilitator, 'progressRedeem');
  };

  const teardown = () => {
    spyCall.restore();
    sinon.restore();
  };
  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    redeemParams = {
      redeemer: '0x0000000000000000000000000000000000000001',
      amount: '100',
      beneficiary: '0x0000000000000000000000000000000000000002',
      gasPrice: '1',
      gasLimit: '100000000',
      nonce: '1',
      hashLock:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      unlockSecret:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
    };
    txOptionsOrigin = {
      from: '0x0000000000000000000000000000000000000003',
      gas: '7500000',
    };
    txOptionsAuxiliary = {
      from: '0x0000000000000000000000000000000000000004',
      gas: '7500000',
    };
    facilitator = new Facilitator(mosaic);
    confirmRedeemIntentResult = true;
    progressRedeemMessageResult = true;
    getMessageHashResult = 'dummy';
  });

  it('should throw an error when redeemer address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeem(
        undefined,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid redeemer address: undefined.',
    );
  });

  it('should throw an error when redeem amount is zero', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        undefined,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Redeem amount must be greater than zero: undefined.',
    );
  });

  it('should throw an error when beneficiary address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        redeemParams.nonce,
        undefined,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid beneficiary address: undefined.',
    );
  });

  it('should throw an error when gas price is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        undefined,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid gas price: undefined.',
    );
  });

  it('should throw an error when gas limit is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        undefined,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid gas limit: undefined.',
    );
  });

  it('should throw an error when nonce is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        undefined,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid redeemer nonce: undefined.',
    );
  });

  it('should throw an error when transaction option for origin chain is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        undefined,
        txOptionsAuxiliary,
      ),
      'Invalid transaction options for origin chain: undefined.',
    );
  });

  it('should throw an error when transaction option for auxiliary chain is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        undefined,
      ),
      'Invalid transaction options for auxiliary chain: undefined.',
    );
  });

  it('should throw an error when facilitator address of origin chain is undefined', async () => {
    delete txOptionsOrigin.from;
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      `Invalid origin chain facilitator address: ${txOptionsOrigin.from}.`,
    );
  });

  it('should throw an error when facilitator address of auxiliary chain is undefined', async () => {
    delete txOptionsAuxiliary.from;
    await AssertAsync.reject(
      facilitator.progressRedeem(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      `Invalid auxiliary chain facilitator address: ${
        txOptionsAuxiliary.from
      }.`,
    );
  });

  it('should call progress stake when all parameters are correct', async () => {
    confirmRedeemIntentResult = true;
    setup();
    const result = await facilitator.progressRedeem(
      redeemParams.redeemer,
      redeemParams.nonce,
      redeemParams.beneficiary,
      redeemParams.amount,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.hashLock,
      redeemParams.unlockSecret,
      txOptionsOrigin,
      txOptionsAuxiliary,
    );
    assert.strictEqual(result, true, 'Progress stake result must be true');
    SpyAssert.assert(spyConfirmRedeemIntent, 1, [
      [
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptionsOrigin,
      ],
    ]);

    SpyAssert.assert(spyGetMesageHash, 1, [
      [
        redeemParams.amount,
        redeemParams.beneficiary,
        facilitator.coGateway.coGatewayAddress,
        redeemParams.nonce,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.redeemer,
        redeemParams.hashLock,
      ],
    ]);

    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ],
    ]);
    SpyAssert.assert(spyProgressRedeemMessage, 1, [
      [
        getMessageHashResult,
        redeemParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ],
    ]);
    teardown();
  });
});
