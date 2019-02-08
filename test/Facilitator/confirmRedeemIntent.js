const chai = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();

const { assert } = chai;

describe('Facilitator.confirmRedeemIntent()', () => {
  let mosaic;
  let redeemParams;
  let txOptions;
  let facilitator;

  let getRedeemMessageHashResult;
  let getOutboxMessageStatusResult;
  let getInboxMessageStatusResult;
  let getCoGatewayProofResult;
  let proveGatewayResult;
  let confirmRedeemIntentResult;

  let spyGetRedeemMessageHash;
  let spyGetOutboxMessageStatus;
  let spyGetInboxMessageStatus;
  let spyGetCoGatewayProof;
  let spyProveGateway;
  let spyConfirmRedeemIntent;
  let spyCall;

  const setup = () => {
    spyGetRedeemMessageHash = sinon.replace(
      Message,
      'getRedeemMessageHash',
      sinon.fake.returns(getRedeemMessageHashResult),
    );
    spyGetOutboxMessageStatus = sinon.replace(
      facilitator.coGateway,
      'getOutboxMessageStatus',
      sinon.fake.resolves(getOutboxMessageStatusResult),
    );
    spyGetInboxMessageStatus = sinon.replace(
      facilitator.gateway,
      'getInboxMessageStatus',
      sinon.fake.resolves(getInboxMessageStatusResult),
    );
    spyGetCoGatewayProof = sinon.replace(
      facilitator,
      'getCoGatewayProof',
      sinon.fake.resolves(getCoGatewayProofResult),
    );
    spyProveGateway = sinon.replace(
      facilitator.gateway,
      'proveGateway',
      sinon.fake.resolves(proveGatewayResult),
    );
    spyConfirmRedeemIntent = sinon.replace(
      facilitator.gateway,
      'confirmRedeemIntent',
      sinon.fake.resolves(confirmRedeemIntentResult),
    );
    spyCall = sinon.spy(facilitator, 'confirmRedeemIntent');
  };

  const teardown = () => {
    spyCall.restore();
    sinon.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();

    redeemParams = {
      redeemer: '0x0000000000000000000000000000000000000001',
      amount: '1000000',
      beneficiary: '0x0000000000000000000000000000000000000002',
      gasPrice: '1',
      gasLimit: '100000000',
      nonce: '1',
      hashLock:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    };
    txOptions = {
      from: redeemParams.redeemer,
      gas: '7500000',
    };

    facilitator = new Facilitator(mosaic);

    getRedeemMessageHashResult =
      '0x0000000000000000000000000000000000000000000000000000000000000002';
    getOutboxMessageStatusResult = MessageStatus.DECLARED;
    getInboxMessageStatusResult = MessageStatus.UNDECLARED;
    getCoGatewayProofResult = {
      blockNumber: '10000',
      accountData: '0x23232323232',
      accountProof: '0x2323232323323223',
    };
    proveGatewayResult = true;
    confirmRedeemIntentResult = true;
  });

  it('should throw an error when redeemer address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        undefined,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid redeemer address: ${undefined}.`,
    );
  });

  it('should throw an error when stake amount is zero', async () => {
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        '0',
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Redeem amount must be greater than zero: ${'0'}.`,
    );
  });

  it('should throw an error when beneficiary address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        redeemParams.nonce,
        undefined,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid beneficiary address: ${undefined}.`,
    );
  });

  it('should throw an error when gas price is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        undefined,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid gas price: ${undefined}.`,
    );
  });

  it('should throw an error when gas limit is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        undefined,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid gas limit: ${undefined}.`,
    );
  });

  it('should throw an error when nonce is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        undefined,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid redeemer nonce: ${undefined}.`,
    );
  });

  it('should throw an error when hash lock is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        undefined,
        txOptions,
      ),
      `Invalid hash lock: ${undefined}.`,
    );
  });

  it('should throw an error when transaction option is undefined', async () => {
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        undefined,
      ),
      `Invalid transaction options: ${undefined}.`,
    );
  });

  it('should throw an error when from address of transaction option is undefined', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid facilitator address: ${txOptions.from}.`,
    );
  });

  it('should throw an exception when outbox message status is undeclared.', async () => {
    getOutboxMessageStatusResult = MessageStatus.UNDECLARED;
    setup();
    await AssertAsync.reject(
      facilitator.confirmRedeemIntent(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      'Redeem message hash must be declared.',
    );
    teardown();
  });

  it('should pass when inbox message status is declared', async () => {
    getInboxMessageStatusResult = MessageStatus.DECLARED;
    setup();
    const result = await facilitator.confirmRedeemIntent(
      redeemParams.redeemer,
      redeemParams.nonce,
      redeemParams.beneficiary,
      redeemParams.amount,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Result of confirm redeem intent must be true',
    );

    SpyAssert.assert(spyGetRedeemMessageHash, 1, [
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
    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [getRedeemMessageHashResult],
    ]);
    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [getRedeemMessageHashResult],
    ]);
    SpyAssert.assert(spyGetCoGatewayProof, 0, [[]]);
    SpyAssert.assert(spyProveGateway, 0, [[]]);
    SpyAssert.assert(spyConfirmRedeemIntent, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass when inbox message status is progressed.', async () => {
    getInboxMessageStatusResult = MessageStatus.PROGRESSED;
    setup();
    const result = await facilitator.confirmRedeemIntent(
      redeemParams.redeemer,
      redeemParams.nonce,
      redeemParams.beneficiary,
      redeemParams.amount,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Result of confirm stake intent must be true',
    );

    SpyAssert.assert(spyGetRedeemMessageHash, 1, [
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
    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [getRedeemMessageHashResult],
    ]);
    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [getRedeemMessageHashResult],
    ]);
    SpyAssert.assert(spyGetCoGatewayProof, 0, [[]]);
    SpyAssert.assert(spyProveGateway, 0, [[]]);
    SpyAssert.assert(spyConfirmRedeemIntent, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass when inbox message status is revoked.', async () => {
    getInboxMessageStatusResult = MessageStatus.REVOKED;
    setup();
    const result = await facilitator.confirmRedeemIntent(
      redeemParams.redeemer,
      redeemParams.nonce,
      redeemParams.beneficiary,
      redeemParams.amount,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Result of confirm stake intent must be true',
    );

    SpyAssert.assert(spyGetRedeemMessageHash, 1, [
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
    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [getRedeemMessageHashResult],
    ]);
    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [getRedeemMessageHashResult],
    ]);
    SpyAssert.assert(spyGetCoGatewayProof, 0, [[]]);
    SpyAssert.assert(spyProveGateway, 0, [[]]);
    SpyAssert.assert(spyConfirmRedeemIntent, 0, [[]]);
    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ],
    ]);

    teardown();
  });

  it('should pass with correct arguments.', async () => {
    setup();
    const result = await facilitator.confirmRedeemIntent(
      redeemParams.redeemer,
      redeemParams.nonce,
      redeemParams.beneficiary,
      redeemParams.amount,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Result of confirm stake intent must be true',
    );

    SpyAssert.assert(spyGetRedeemMessageHash, 1, [
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
    SpyAssert.assert(spyGetOutboxMessageStatus, 1, [
      [getRedeemMessageHashResult],
    ]);
    SpyAssert.assert(spyGetInboxMessageStatus, 1, [
      [getRedeemMessageHashResult],
    ]);
    SpyAssert.assert(spyGetCoGatewayProof, 1, [[getRedeemMessageHashResult]]);
    SpyAssert.assert(spyProveGateway, 1, [
      [
        getCoGatewayProofResult.blockNumber,
        getCoGatewayProofResult.accountData,
        getCoGatewayProofResult.accountProof,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spyConfirmRedeemIntent, 1, [
      [
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        getCoGatewayProofResult.blockNumber,
        redeemParams.hashLock,
        getCoGatewayProofResult.storageProof,
        txOptions,
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
        txOptions,
      ],
    ]);

    teardown();
  });
});
