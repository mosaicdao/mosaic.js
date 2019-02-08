const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const OSTPrime = require('../../src/ContractInteract/OSTPrime');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('OSTPrime.balanceOf()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
    ostPrime = new OSTPrime(web3, ostPrimeAddress);
  });

  it('should pass with correct params', async () => {
    let balance = '100';

    const spyContractBalanceOf = sinon.replace(
      ostPrime.contract.methods,
      'balanceOf',
      sinon.fake.returns({
        call: () => Promise.resolve(balance),
      }),
    );

    const spyOSTPrimeBalanceOf = sinon.spy(ostPrime, 'balanceOf');

    const accountAddress = '0x0000000000000000000000000000000000000003';

    const result = await ostPrime.balanceOf(accountAddress);

    assert.strictEqual(result, balance, 'It must return expected balance');

    SpyAssert.assert(spyContractBalanceOf, 1, [[accountAddress]]);
    SpyAssert.assert(spyOSTPrimeBalanceOf, 1, [[accountAddress]]);

    sinon.restore();
  });

  it('should throw for invalid account address', async () => {
    const accountAddress = '0x123';

    await AssertAsync.reject(
      ostPrime.balanceOf(accountAddress),
      `Invalid address: ${accountAddress}.`,
    );
  });

  it('should throw for undefined account address', async () => {
    const accountAddress = undefined;

    await AssertAsync.reject(
      ostPrime.balanceOf(accountAddress),
      `Invalid address: ${accountAddress}.`,
    );
  });
});
