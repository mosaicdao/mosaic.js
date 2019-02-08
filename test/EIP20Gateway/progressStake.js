const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const Utils = require('../../src/utils/Utils');

describe('EIP20Gateway.progressStake()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let txOptions;
  let messageHash;
  let unlockSecret;
  let mockedTx;

  let spyRawTx;
  let spyCall;
  let spySendTransaction;

  const setup = () => {
    spyRawTx = sinon.replace(
      gateway,
      '_progressStakeRawTx',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(gateway, 'progressStake');

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

    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000222';
    unlockSecret = '0xunlocksecret';
    mockedTx = 'MockedTx';
  });

  it('should throw error transaction object is invalid', async () => {
    await AssertAsync.reject(
      gateway.progressStake(messageHash, unlockSecret, undefined),
      `Invalid transaction options: ${undefined}.`,
    );
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await gateway.progressStake(
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
