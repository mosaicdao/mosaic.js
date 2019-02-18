'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const UtilityToken = require('../../src/ContractInteract/UtilityToken');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Utils = require('../../src/utils/Utils');

describe('UtilityToken.approve()', () => {
  let web3;
  let utilityTokenAddress;
  let utilityToken;

  beforeEach(() => {
    web3 = new Web3();
    utilityTokenAddress = '0x0000000000000000000000000000000000000002';
    utilityToken = new UtilityToken(web3, utilityTokenAddress);
  });

  it('should pass with correct params', async () => {
    const mockTX = 'mockTX';

    const spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
    const approveRawTxSpy = sinon.replace(
      utilityToken,
      'approveRawTx',
      sinon.fake.resolves(mockTX),
    );
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';
    const txOptions = { from: '0x0000000000000000000000000000000000000004' };

    const result = await utilityToken.approve(
      spenderAddress,
      amount,
      txOptions,
    );

    assert.isTrue(result, 'Approve should return true');

    SpyAssert.assert(approveRawTxSpy, 1, [[spenderAddress, amount]]);

    SpyAssert.assert(spySendTransaction, 1, [[mockTX, txOptions]]);
    sinon.restore();
  });

  it('should throw for invalid from address in tx options', async () => {
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';
    const txOptions = { from: '0x1234' };

    await AssertAsync.reject(
      utilityToken.approve(spenderAddress, amount, txOptions),
      `Invalid from address: ${txOptions.from}.`,
    );
  });

  it('should throw for undefined address in tx options', async () => {
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';
    const txOptions = { from: undefined };

    await AssertAsync.reject(
      utilityToken.approve(spenderAddress, amount, txOptions),
      `Invalid from address: ${txOptions.from}.`,
    );
  });

  it('should throw for undefined tx options', async () => {
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';
    const txOptions = undefined;

    await AssertAsync.reject(
      utilityToken.approve(spenderAddress, amount, txOptions),
      `Invalid transaction options: ${txOptions}.`,
    );
  });
});
