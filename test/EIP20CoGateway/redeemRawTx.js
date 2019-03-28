'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('EIP20CoGateway.redeemRawTx()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let redeemParams;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'redeem',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, 'redeemRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    redeemParams = {
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: '0xhashlock',
    };
    mockedTx = 'MockedTx';
  });

  it('should throw error when redeem amount is zero', async () => {
    const expectedErrorMessage = `Redeem amount must be greater than zero: ${0}.`;

    await AssertAsync.reject(
      coGateway.redeemRawTx(
        0,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      expectedErrorMessage,
    );
  });

  it('should throw error when redeem amount is less than zero', async () => {
    const expectedErrorMessage = `Redeem amount must be greater than zero: ${-1}.`;

    await AssertAsync.reject(
      coGateway.redeemRawTx(
        -1,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      expectedErrorMessage,
    );
  });

  it('should throw error when beneficiary address is invalid', async () => {
    const expectedErrorMessage = 'Invalid beneficiary address: 0x123.';

    await AssertAsync.reject(
      coGateway.redeemRawTx(
        redeemParams.amount,
        '0x123',
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      expectedErrorMessage,
    );
  });

  it('should throw error when gas price is undefined', async () => {
    const expectedErrorMessage = 'Invalid gas price: undefined.';

    await AssertAsync.reject(
      coGateway.redeemRawTx(
        redeemParams.amount,
        redeemParams.beneficiary,
        undefined,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      expectedErrorMessage,
    );
  });

  it('should throw error when gas limit is undefined', async () => {
    const expectedErrorMessage = 'Invalid gas limit: undefined.';

    await AssertAsync.reject(
      coGateway.redeemRawTx(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        undefined,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      expectedErrorMessage,
    );
  });

  it('should throw error when nonce is undefined', async () => {
    const expectedErrorMessage = 'Invalid nonce: undefined.';

    await AssertAsync.reject(
      coGateway.redeemRawTx(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        undefined,
        redeemParams.hashLock,
      ),
      expectedErrorMessage,
    );
  });

  it('should throw error when nonce is undefined', async () => {
    const expectedErrorMessage = 'Invalid hash lock: undefined.';

    await AssertAsync.reject(
      coGateway.redeemRawTx(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        undefined,
      ),
      expectedErrorMessage,
    );
  });

  it('should throw an error when the possible reward is greater than the amount', async () => {
    await AssertAsync.reject(
      coGateway.redeemRawTx(
        '99',
        redeemParams.beneficiary,
        '2',
        '50',
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      'The maximum possible reward of gasPrice*gasLimit is greater than the redeem amount. It must be less.\n    gasPrice: 2\n    gasLimit: 50\n    redeem amount: 99',
    );
  });

  it('should return correct transaction object', async () => {
    setup();
    const result = await coGateway.redeemRawTx(
      redeemParams.amount,
      redeemParams.beneficiary,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.nonce,
      redeemParams.hashLock,
    );
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [
      [
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ],
    ]);
    tearDown();
  });
});
