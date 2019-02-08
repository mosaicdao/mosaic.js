const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const assert = chai.assert;
const OSTPrime = require('../../src/ContractInteract/OSTPrime');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');
const Utils = require('../../src/utils/Utils');

describe('OSTPrime.unwrap()', () => {
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
      '_unwrapRawTx',
      sinon.fake.resolves(mockTX),
    );
    const amount = '100';
    const txOptions = { from: '0x0000000000000000000000000000000000000004' };

    const result = await ostPrime.unwrap(amount, txOptions);

    assert.isTrue(result, 'Unwrap should return true');

    SpyAssert.assert(unwrapRawTxSpy, 1, [[amount]]);

    SpyAssert.assert(spySendTransaction, 1, [[mockTX, txOptions]]);
    sinon.restore();
  });

  it('should throw for invalid from address in tx options', async () => {
    const amount = '100';
    const txOptions = { from: '0x1234' };

    await AssertAsync.reject(
      ostPrime.unwrap(amount, txOptions),
      `Invalid from address: ${txOptions.from}.`,
    );
  });

  it('should throw for undefined address in tx options', async () => {
    const amount = '100';
    const txOptions = { from: undefined };

    await AssertAsync.reject(
      ostPrime.unwrap(amount, txOptions),
      `Invalid from address: ${txOptions.from}.`,
    );
  });

  it('should throw for undefined tx options', async () => {
    const amount = '100';
    const txOptions = undefined;

    await AssertAsync.reject(
      ostPrime.unwrap(amount, txOptions),
      `Invalid transaction options: ${txOptions}.`,
    );
  });
});
