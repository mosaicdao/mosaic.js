'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const Utils = require('../../src/utils/Utils');

describe('EIP20CoGateway.progressRedeem()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let txOptions;
  let messageHash;
  let unlockSecret;
  let mockedTx;

  let spyRawTx;
  let spyCall;
  let spySendTransaction;

  const setup = () => {
    spyRawTx = sinon.replace(
      coGateway,
      'progressRedeemRawTx',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, 'progressRedeem');

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
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    txOptions = {
      from: '0x0000000000000000000000000000000000000003',
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };

    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000222';
    unlockSecret = '0xunlocksecret';
    mockedTx = 'MockedTx';
  });

  it('should throw an error when transaction object is undefined', async () => {
    await AssertAsync.reject(
      coGateway.progressRedeem(messageHash, unlockSecret, undefined),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw an error when from address in transaction object is undefined', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      coGateway.progressRedeem(messageHash, unlockSecret, txOptions),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });

  it('should return correct transaction object', async () => {
    setup();
    const result = await coGateway.progressRedeem(
      messageHash,
      unlockSecret,
      txOptions,
    );
    assert.strictEqual(result, true, 'Result must be true.');

    SpyAssert.assert(spyRawTx, 1, [[messageHash, unlockSecret]]);
    SpyAssert.assert(spyCall, 1, [[messageHash, unlockSecret, txOptions]]);
    SpyAssert.assert(spySendTransaction, 1, [[mockedTx, txOptions]]);
    tearDown();
  });
});
