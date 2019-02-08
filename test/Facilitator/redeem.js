const chai = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

const { assert } = chai;

describe('Facilitator.redeem()', () => {
  let mosaic;
  let redeemParams;
  let txOptions;
  let facilitator;

  let isRedeemAmountApproved;
  let approveRedeemAmountResult;
  let bounty;
  let nonce;
  let redeemResult;

  let spyIsRedeemAmountApproved;
  let spyApproveRedeemAmount;
  let spyGetBounty;
  let spyGetNonce;
  let spyGatewayRedeem;
  let spyCall;

  const setup = () => {
    spyIsRedeemAmountApproved = sinon.replace(
      facilitator.coGateway,
      'isRedeemAmountApproved',
      sinon.fake.resolves(isRedeemAmountApproved),
    );
    spyApproveRedeemAmount = sinon.replace(
      facilitator.coGateway,
      'approveRedeemAmount',
      sinon.fake.resolves(approveRedeemAmountResult),
    );
    spyGetBounty = sinon.replace(
      facilitator.coGateway,
      'getBounty',
      sinon.fake.resolves(bounty),
    );
    spyGetNonce = sinon.replace(
      facilitator.coGateway,
      'getNonce',
      sinon.fake.resolves(nonce),
    );
    spyGatewayRedeem = sinon.replace(
      facilitator.coGateway,
      'redeem',
      sinon.fake.resolves(redeemResult),
    );
    spyCall = sinon.spy(facilitator, 'redeem');
  };

  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    redeemParams = {
      redeemer: '0x0000000000000000000000000000000000000001',
      amount: '100',
      beneficiary: '0x0000000000000000000000000000000000000002',
      gasPrice: '1',
      gasLimit: '100000000',
      hashLock:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    };
    txOptions = {
      from: redeemParams.redeemer,
      gas: '7500000',
      value: bounty,
    };
    facilitator = new Facilitator(mosaic);

    isRedeemAmountApproved = true;
    approveRedeemAmountResult = true;
    bounty = '100';
    nonce = '1';
    redeemResult = true;
  });

  it('should throw an error when redeemer address is undefined', async () => {
    await AssertAsync.reject(
      facilitator.redeem(
        undefined,
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid redeemer address: ${undefined}.`,
    );
  });

  it('should throw an error when redeem amount is zero', async () => {
    await AssertAsync.reject(
      facilitator.redeem(
        redeemParams.redeemer,
        '0',
        redeemParams.beneficiary,
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
      facilitator.redeem(
        redeemParams.redeemer,
        redeemParams.amount,
        undefined,
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
      facilitator.redeem(
        redeemParams.redeemer,
        redeemParams.amount,
        redeemParams.beneficiary,
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
      facilitator.redeem(
        redeemParams.redeemer,
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        undefined,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid gas limit: ${undefined}.`,
    );
  });

  it('should throw an error when hash lock is undefined', async () => {
    await AssertAsync.reject(
      facilitator.redeem(
        redeemParams.redeemer,
        redeemParams.amount,
        redeemParams.beneficiary,
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
      facilitator.redeem(
        redeemParams.redeemer,
        redeemParams.amount,
        redeemParams.beneficiary,
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
      facilitator.redeem(
        redeemParams.redeemer,
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Invalid facilitator address: ${txOptions.from}.`,
    );
  });

  it('should throw an error when value passed in transaction option is not equal to bounty amount', async () => {
    txOptions.value = '0';
    setup();
    await AssertAsync.reject(
      facilitator.redeem(
        redeemParams.redeemer,
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ),
      `Value passed in transaction object ${
        txOptions.value
      } must be equal to bounty amount ${bounty}`,
    );
    teardown();
  });

  it('should call approve redeem amount if CoGateway is not approved for token transfer', async () => {
    isRedeemAmountApproved = false;
    setup();
    const result = await facilitator.redeem(
      redeemParams.redeemer,
      redeemParams.amount,
      redeemParams.beneficiary,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Returned valued must match with the expected value',
    );

    SpyAssert.assert(spyIsRedeemAmountApproved, 1, [
      [redeemParams.redeemer, redeemParams.amount],
    ]);
    const txOptionForApproval = Object.assign({}, txOptions);
    delete txOptionForApproval.value;
    SpyAssert.assertCall(spyApproveRedeemAmount, 1);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyGetNonce, 1, [[redeemParams.redeemer]]);
    SpyAssert.assert(spyGatewayRedeem, 1, [
      [
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        '1',
        redeemParams.hashLock,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.redeemer,
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ],
    ]);
    teardown();
  });

  it('should pass with correct input params', async () => {
    setup();
    const result = await facilitator.redeem(
      redeemParams.redeemer,
      redeemParams.amount,
      redeemParams.beneficiary,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Returned valued must match with the expected value',
    );

    SpyAssert.assert(spyIsRedeemAmountApproved, 1, [
      [redeemParams.redeemer, redeemParams.amount],
    ]);
    SpyAssert.assert(spyApproveRedeemAmount, 0, [[]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyGetNonce, 1, [[redeemParams.redeemer]]);
    SpyAssert.assert(spyGatewayRedeem, 1, [
      [
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        '1',
        redeemParams.hashLock,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.redeemer,
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        txOptions,
      ],
    ]);
    teardown();
  });
});
