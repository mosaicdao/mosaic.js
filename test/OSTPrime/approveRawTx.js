'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const OSTPrime = require('../../src/ContractInteract/OSTPrime');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('OSTPrime.approveRawTx()', () => {
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
    const spyApprove = sinon.replace(
      ostPrime.contract.methods,
      'approve',
      sinon.fake.resolves(Promise.resolve(mockTx)),
    );

    const spyApproveRawTx = sinon.spy(ostPrime, 'approveRawTx');

    const spenderAddress = '0x0000000000000000000000000000000000000004';
    const amount = '100';

    const tx = await ostPrime.approveRawTx(spenderAddress, amount);

    assert.strictEqual(tx, mockTx, 'It must return expected tx');

    SpyAssert.assert(spyApprove, 1, [[spenderAddress, amount]]);
    SpyAssert.assert(spyApproveRawTx, 1, [[spenderAddress, amount]]);

    sinon.restore();
  });

  it('should throw for invalid spender address', async () => {
    const amount = '100';
    const spenderAddress = '0x123';

    await AssertAsync.reject(
      ostPrime.approveRawTx(spenderAddress, amount),
      `Invalid spender address: ${spenderAddress}.`,
    );
  });

  it('should throw for undefined spender address', async () => {
    const amount = '100';
    const spenderAddress = undefined;

    await AssertAsync.reject(
      ostPrime.approveRawTx(spenderAddress, amount),
      `Invalid spender address: ${spenderAddress}.`,
    );
  });

  it('should throw an error when amount is undefined', async () => {
    const spenderAddress = '0x0000000000000000000000000000000000000004';
    const amount = undefined;

    await AssertAsync.reject(
      ostPrime.approveRawTx(spenderAddress, amount),
      `Invalid approval amount: ${amount}.`,
    );
  });
});
