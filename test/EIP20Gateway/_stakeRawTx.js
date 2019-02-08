'use strict';

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const { assert } = chai;

describe('EIP20Gateway._stakeRawTx()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let stakeParams;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'stake',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(gateway, '_stakeRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);

    stakeParams = {
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: '0xhashlock',
    };

    mockedTx = 'MockedTx';
  });

  it('should throw error when stake amount is zero', async () => {
    await AssertAsync.reject(
      gateway._stakeRawTx(
        0,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ),
      'Stake amount must be greater than zero: 0.',
    );
  });

  it('should throw error when beneficiary address is undefined', async function() {
    await AssertAsync.reject(
      gateway._stakeRawTx(
        stakeParams.amount,
        '0x123',
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ),
      'Invalid beneficiary address: 0x123.',
    );
  });

  it('should throw error when gas price is undefined', async function() {
    await AssertAsync.reject(
      gateway._stakeRawTx(
        stakeParams.amount,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ),
      `Invalid gas price: ${undefined}.`,
    );
  });

  it('should throw error when gas limit is undefined', async function() {
    await AssertAsync.reject(
      gateway._stakeRawTx(
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        undefined,
        stakeParams.nonce,
        stakeParams.hashLock,
      ),
      `Invalid gas limit: ${undefined}.`,
    );
  });

  it('should throw error when nonce is undefined', async () => {
    await AssertAsync.reject(
      gateway._stakeRawTx(
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        undefined,
        stakeParams.hashLock,
      ),
      `Invalid nonce: ${undefined}.`,
    );
  });

  it('should throw error when hashlock is undefined', async () => {
    await AssertAsync.reject(
      gateway._stakeRawTx(
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        undefined,
      ),
      `Invalid hash lock: ${undefined}.`,
    );
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await gateway._stakeRawTx(
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.nonce,
      stakeParams.hashLock,
    );
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ],
    ]);
    tearDown();
  });
});
