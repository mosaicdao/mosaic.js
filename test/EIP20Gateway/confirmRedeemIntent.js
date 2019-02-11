'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const Utils = require('../../src/utils/Utils');

describe('EIP20Gateway.confirmRedeemIntent()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let txOptions;
  let redeemParams;
  let mockedTx;

  let spyRawTx;
  let spyCall;
  let spySendTransaction;

  const setup = () => {
    spyRawTx = sinon.replace(
      gateway,
      '_confirmRedeemIntentRawTx',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(gateway, 'confirmRedeemIntent');

    spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);

    txOptions = {
      from: '0x0000000000000000000000000000000000000003',
      to: gatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };

    redeemParams = {
      redeemer: '0x0000000000000000000000000000000000000005',
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: '0xhashlock',
      blockHeight: '12345',
      storageProof: '0x123',
    };
    mockedTx = 'MockedTx';
  });

  it('should throw error when transaction object is invalid', async () => {
    await AssertAsync.reject(
      gateway.confirmRedeemIntent(
        redeemParams.staker,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.blockHeight,
        redeemParams.storageProof,
        undefined,
      ),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw error when from address in transaction object is undefined', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      gateway.confirmRedeemIntent(
        redeemParams.staker,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.blockHeight,
        redeemParams.storageProof,
        txOptions,
      ),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });

  it('should return correct transaction object', async () => {
    setup();
    const result = await gateway.confirmRedeemIntent(
      redeemParams.staker,
      redeemParams.nonce,
      redeemParams.beneficiary,
      redeemParams.amount,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.hashLock,
      redeemParams.blockHeight,
      redeemParams.storageProof,
      txOptions,
    );
    assert.strictEqual(result, true, 'Result must be true.');

    SpyAssert.assert(spyRawTx, 1, [
      [
        redeemParams.staker,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.blockHeight,
        redeemParams.storageProof,
      ],
    ]);

    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.staker,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        redeemParams.blockHeight,
        redeemParams.storageProof,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spySendTransaction, 1, [[mockedTx, txOptions]]);
    tearDown();
  });
});
