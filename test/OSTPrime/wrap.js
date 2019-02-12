'use strict';

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const assert = chai.assert;
const OSTPrime = require('../../src/ContractInteract/OSTPrime');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Utils = require('../../src/utils/Utils');

describe('OSTPrime.wrap()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
    ostPrime = new OSTPrime(web3, ostPrimeAddress);
  });

  it('should pass with correct params', async () => {
    const mockTX = 'mockTX';

    const spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
    const unwrapRawTxSpy = sinon.replace(
      ostPrime,
      'wrapRawTx',
      sinon.fake.resolves(mockTX),
    );
    const amount = '100';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000004',
      value: amount,
    };

    const result = await ostPrime.wrap(txOptions);

    assert.isTrue(result, 'Wrap should return true');

    SpyAssert.assert(unwrapRawTxSpy, 1, [[]]);

    SpyAssert.assert(spySendTransaction, 1, [[mockTX, txOptions]]);
    sinon.restore();
  });

  it('should throw if amount is less than zero', async () => {
    const amount = '-1';
    const txOptions = {
      from: '0x0000000000000000000000000000000000000004',
      value: amount,
    };

    await AssertAsync.reject(
      ostPrime.wrap(txOptions),
      `Transaction value amount must not be zero: ${txOptions.value}.`,
    );
  });

  it('should throw for invalid from address in tx options', async () => {
    const amount = '100';
    const txOptions = {
      from: '0x1234',
      value: amount,
    };

    await AssertAsync.reject(
      ostPrime.wrap(txOptions),
      `Invalid address: ${txOptions.from}.`,
    );
  });

  it('should throw for undefined address in tx options', async () => {
    const amount = '100';
    const txOptions = {
      from: undefined,
      value: amount,
    };

    await AssertAsync.reject(
      ostPrime.wrap(txOptions),
      `Invalid address: ${txOptions.from}.`,
    );
  });

  it('should throw for undefined tx options', async () => {
    const txOptions = undefined;

    await AssertAsync.reject(
      ostPrime.wrap(txOptions),
      `Invalid transaction options: ${txOptions}.`,
    );
  });
});
