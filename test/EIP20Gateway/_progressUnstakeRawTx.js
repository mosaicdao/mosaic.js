'use strict';

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const { assert } = chai;

describe('EIP20Gateway._progressUnstakeRawTx()', () => {
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
      'progressUnstake',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(gateway, '_progressUnstakeRawTx');
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
      gateway._progressUnstakeRawTx(undefined, unlockSecret),
      `Invalid message hash: ${undefined}.`,
    );
  });

  it('should throw error when unlock secret is invalid', async () => {
    await AssertAsync.reject(
      gateway._progressUnstakeRawTx(messageHash, undefined),
      `Invalid unlock secret: ${undefined}.`,
    );
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await gateway._progressUnstakeRawTx(
      messageHash,
      unlockSecret,
    );
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
