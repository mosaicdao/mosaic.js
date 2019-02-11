'use strict';

const { assert } = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();

describe('Facilitator.confirmStakeIntent()', () => {
  let mosaic;
  let stakeParams;
  let txOptions;
  let facilitator;

  let getStakeMessageHashResult;
  let getOutboxMessageStatusResult;
  let getInboxMessageStatusResult;
  let getGatewayProofResult;
  let proveGatewayResult;
  let confirmStakeIntentResult;

  let spyGetStakeMessageHash;
  let spyGetOutboxMessageStatus;
  let spyGetInboxMessageStatus;
  let spyGetGatewayProof;
  let spyProveGateway;
  let spyConfirmStakeIntent;
  let spyCall;

  const setup = () => {
    spyGetStakeMessageHash = sinon.replace(
      Message,
      'getStakeMessageHash',
      sinon.fake.returns(getStakeMessageHashResult),
    );
    spyGetOutboxMessageStatus = sinon.replace(
      facilitator.gateway,
      'getOutboxMessageStatus',
      sinon.fake.resolves(getOutboxMessageStatusResult),
    );
    spyGetInboxMessageStatus = sinon.replace(
      facilitator.coGateway,
      'getInboxMessageStatus',
      sinon.fake.resolves(getInboxMessageStatusResult),
    );
    spyGetGatewayProof = sinon.replace(
      facilitator,
      'getGatewayProof',
      sinon.fake.resolves(getGatewayProofResult),
    );
    spyProveGateway = sinon.replace(
      facilitator.coGateway,
      'proveGateway',
      sinon.fake.resolves(proveGatewayResult),
    );
    spyConfirmStakeIntent = sinon.replace(
      facilitator.coGateway,
      'confirmStakeIntent',
      sinon.fake.resolves(confirmStakeIntentResult),
    );
    spyCall = sinon.spy(facilitator, 'confirmStakeIntent');
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
    };
    txOptions = {
      from: stakeParams.staker,
      gas: '7500000',
    };

    facilitator = new Facilitator(mosaic);

    getStakeMessageHashResult =
      '0x0000000000000000000000000000000000000000000000000000000000000002';
    getOutboxMessageStatusResult = MessageStatus.DECLARED;
    getInboxMessageStatusResult = MessageStatus.UNDECLARED;
    getGatewayProofResult = {
      blockNumber: '10000',
      accountData: '0x23232323232',
      accountProof: '0x2323232323323223',
    };
    proveGatewayResult = true;
    confirmStakeIntentResult = true;
  });

  it('should throw an error when staker address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        undefined,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ),
      'Invalid staker address: undefined.',
    );
  });

  it('should throw an error when stake amount is zero', async () => {
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        '0',
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ),
      `Stake amount must be greater than be zero: ${'0'}.`,
    );
  });

  it('should throw an error when beneficiary address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.amount,
        undefined,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ),
      'Invalid beneficiary address: undefined.',
    );
  });

  it('should throw an error when gas price is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ),
      'Invalid gas price: undefined.',
    );
  });

  it('should throw an error when gas limit is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        undefined,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ),
      'Invalid gas limit: undefined.',
    );
  });

  it('should throw an error when nonce is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        undefined,
        stakeParams.hashLock,
        txOptions,
      ),
      'Invalid staker nonce: undefined.',
    );
  });

  it('should throw an error when hash lock is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        undefined,
        txOptions,
      ),
      'Invalid hash lock: undefined.',
    );
  });

  it('should throw an error when transaction option is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        undefined,
      ),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw an error when from address of transaction option is undefined', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ),
      `Invalid facilitator address: ${txOptions.from}.`,
    );
  });

  it('should throw an exception when outbox message status is undeclared.', async () => {
    getOutboxMessageStatusResult = MessageStatus.UNDECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ),
      'Stake message hash must be declared.',
    );
    teardown();
  });

  it('should pass when inbox message status is declared.', async () => {
    getInboxMessageStatusResult = MessageStatus.DECLARED;
    setup();
    const result = await facilitator.confirmStakeIntent(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.nonce,
      stakeParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Result of confirm stake intent must be true',
    );

    SpyAssert.assert(spyGetStakeMessageHash, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        facilitator.gateway.gatewayAddress,
        stakeParams.nonce,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.staker,
        stakeParams.hashLock,
      ],
    ]);
    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [getStakeMessageHashResult],
    ]);
    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [getStakeMessageHashResult],
    ]);
    SpyAssert.assert(spyGetGatewayProof, 0, [[]]);
    SpyAssert.assert(spyProveGateway, 0, [[]]);
    SpyAssert.assert(spyConfirmStakeIntent, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass when inbox message status is progressed.', async () => {
    getInboxMessageStatusResult = MessageStatus.PROGRESSED;
    setup();
    const result = await facilitator.confirmStakeIntent(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.nonce,
      stakeParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Result of confirm stake intent must be true',
    );

    SpyAssert.assert(spyGetStakeMessageHash, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        facilitator.gateway.gatewayAddress,
        stakeParams.nonce,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.staker,
        stakeParams.hashLock,
      ],
    ]);
    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [getStakeMessageHashResult],
    ]);
    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [getStakeMessageHashResult],
    ]);
    SpyAssert.assert(spyGetGatewayProof, 0, [[]]);
    SpyAssert.assert(spyProveGateway, 0, [[]]);
    SpyAssert.assert(spyConfirmStakeIntent, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass when inbox message status is revoked.', async () => {
    getInboxMessageStatusResult = MessageStatus.REVOKED;
    setup();
    const result = await facilitator.confirmStakeIntent(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.nonce,
      stakeParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Result of confirm stake intent must be true',
    );

    SpyAssert.assert(spyGetStakeMessageHash, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        facilitator.gateway.gatewayAddress,
        stakeParams.nonce,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.staker,
        stakeParams.hashLock,
      ],
    ]);
    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [getStakeMessageHashResult],
    ]);
    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [getStakeMessageHashResult],
    ]);
    SpyAssert.assert(spyGetGatewayProof, 0, [[]]);
    SpyAssert.assert(spyProveGateway, 0, [[]]);
    SpyAssert.assert(spyConfirmStakeIntent, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
        txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass with correct arguments.', async () => {
    setup();
    const result = await facilitator.confirmStakeIntent(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.nonce,
      stakeParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Result of confirm stake intent must be true',
    );

    SpyAssert.assert(spyGetStakeMessageHash, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        facilitator.gateway.gatewayAddress,
        stakeParams.nonce,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.staker,
        stakeParams.hashLock,
      ],
    ]);
    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [getStakeMessageHashResult],
    ]);
    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [getStakeMessageHashResult],
    ]);
    SpyAssert.assert(spyGetGatewayProof, 1, [[getStakeMessageHashResult]]);
    SpyAssert.assert(spyProveGateway, 1, [
      [
        getGatewayProofResult.blockNumber,
        getGatewayProofResult.accountData,
        getGatewayProofResult.accountProof,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spyConfirmStakeIntent, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        getGatewayProofResult.blockNumber,
        getGatewayProofResult.storageProof,
        txOptions,
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
        txOptions,
      ],
    ]);

    teardown();
  });
});
