'use strict';

const { assert } = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

describe('Facilitator.progressStake()', () => {
  let mosaic;
  let stakeParams;
  let txOptionsOrigin;
  let txOptionsAuxiliary;
  let facilitator;

  let confirmStakeIntentResult;
  let progressStakeMessageResult;
  let getMessageHashResult;

  let spyConfirmStakeIntent;
  let spyProgressStakeMessage;
  let spyGetMesageHash;
  let spyCall;

  const setup = () => {
    spyConfirmStakeIntent = sinon.replace(
      facilitator,
      'confirmStakeIntent',
      sinon.fake.resolves(confirmStakeIntentResult),
    );
    spyProgressStakeMessage = sinon.replace(
      facilitator,
      'progressStakeMessage',
      sinon.fake.resolves(progressStakeMessageResult),
    );
    spyGetMesageHash = sinon.replace(
      Message,
      'getStakeMessageHash',
      sinon.fake.returns(getMessageHashResult),
    );
    spyCall = sinon.spy(facilitator, 'progressStake');
  };

  const teardown = () => {
    spyCall.restore();
    sinon.restore();
  };
  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    stakeParams = {
      staker: '0x0000000000000000000000000000000000000001',
      amount: '1000000',
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
    confirmStakeIntentResult = true;
    progressStakeMessageResult = true;
    getMessageHashResult = 'dummy';
  });

  it('should throw an error when staker address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressStake(
        undefined,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid staker address: undefined.',
    );
  });

  it('should throw an error when stake amount is zero', async () => {
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        undefined,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Stake amount must be greater than zero: undefined.',
    );
  });

  it('should throw an error when beneficiary address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        stakeParams.amount,
        undefined,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid beneficiary address: undefined.',
    );
  });

  it('should throw an error when gas price is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid gas price: undefined.',
    );
  });

  it('should throw an error when gas limit is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        undefined,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid gas limit: undefined.',
    );
  });

  it('should throw an error when nonce is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        undefined,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      'Invalid staker nonce: undefined.',
    );
  });

  it('should throw an error when transaction option for origin chain is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        undefined,
        txOptionsAuxiliary,
      ),
      'Invalid transaction options for origin chain: undefined.',
    );
  });

  it('should throw an error when transaction option for auxiliary chain is undefined', async () => {
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        undefined,
      ),
      'Invalid transaction options for auxiliary chain: undefined.',
    );
  });

  it('should throw an error when facilitator address of origin chain is undefined', async () => {
    delete txOptionsOrigin.from;
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      `Invalid origin chain facilitator address: ${txOptionsOrigin.from}.`,
    );
  });

  it('should throw an error when facilitator address of auxiliary chain is undefined', async () => {
    delete txOptionsAuxiliary.from;
    await AssertAsync.reject(
      facilitator.progressStake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ),
      `Invalid auxiliary chain facilitator address: ${
        txOptionsAuxiliary.from
      }.`,
    );
  });

  it('should call progress stake when all parameters are correct', async () => {
    confirmStakeIntentResult = true;
    setup();
    const result = await facilitator.progressStake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.nonce,
      stakeParams.hashLock,
      stakeParams.unlockSecret,
      txOptionsOrigin,
      txOptionsAuxiliary,
    );
    assert.strictEqual(result, true, 'Progress stake result must be true');
    SpyAssert.assert(spyConfirmStakeIntent, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptionsAuxiliary,
      ],
    ]);

    SpyAssert.assert(spyGetMesageHash, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        facilitator.gateway.address,
        stakeParams.nonce,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.staker,
        stakeParams.hashLock,
      ],
    ]);

    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ],
    ]);
    SpyAssert.assert(spyProgressStakeMessage, 1, [
      [
        getMessageHashResult,
        stakeParams.unlockSecret,
        txOptionsOrigin,
        txOptionsAuxiliary,
      ],
    ]);
    teardown();
  });
});
