'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const OSTPrime = require('../../src/ContractInteract/OSTPrime');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('OSTPrime.wrapRawTx()', () => {
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
      'wrap',
      sinon.fake.resolves(Promise.resolve(mockTx)),
    );

    const spyWrapRawTx = sinon.spy(ostPrime, 'wrapRawTx');

    const result = await ostPrime.wrapRawTx();

    assert.strictEqual(result, mockTx, 'It must return expected tx');

    SpyAssert.assert(spyUnwrap, 1, [[]]);
    SpyAssert.assert(spyWrapRawTx, 1, [[]]);

    sinon.restore();
  });
});
