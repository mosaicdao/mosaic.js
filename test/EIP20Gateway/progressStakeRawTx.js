'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('EIP20Gateway.progressStakeRawTx()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let messageHash;
  let unlockSecret;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'progressStake',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(gateway, 'progressStakeRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);

    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    unlockSecret = '0x1111111111';
    mockedTx = 'MockedTx';
  });

  it('should throw error when message hash is invalid', async () => {
    await AssertAsync.reject(
      gateway.progressStakeRawTx(undefined, unlockSecret),
      'Invalid message hash: undefined.',
    );
  });

  it('should throw error when unlock secret is invalid', async () => {
    await AssertAsync.reject(
      gateway.progressStakeRawTx(messageHash, undefined),
      'Invalid unlock secret: undefined.',
    );
  });

  it('should return correct transaction object', async () => {
    setup();
    const result = await gateway.progressStakeRawTx(messageHash, unlockSecret);
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [[messageHash, unlockSecret]]);
    SpyAssert.assert(spyCall, 1, [[messageHash, unlockSecret]]);
    tearDown();
  });
});
