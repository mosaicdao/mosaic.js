'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const OSTPrime = require('../../src/ContractInteract/OSTPrime');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('OSTPrime.unwrapRawTx()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
    ostPrime = new OSTPrime(web3, ostPrimeAddress);
  });

  it('should pass with correct params', async () => {
    let mockTx = 'tx';
    const spyUnwrap = sinon.replace(
      ostPrime.contract.methods,
      'unwrap',
      sinon.fake.resolves(Promise.resolve(mockTx)),
    );

    const spyUnwrapRawTx = sinon.spy(ostPrime, 'unwrapRawTx');
    const amount = '100';

    const result = await ostPrime.unwrapRawTx(amount);

    assert.strictEqual(result, mockTx, 'It must return expected tx');

    SpyAssert.assert(spyUnwrap, 1, [[amount]]);
    SpyAssert.assert(spyUnwrapRawTx, 1, [[amount]]);

    sinon.restore();
  });

  it('should throw an error when amount is undefined', async () => {
    const amount = undefined;

    await AssertAsync.reject(
      ostPrime.unwrapRawTx(amount),
      `Invalid amount: ${amount}.`,
    );
  });
});
