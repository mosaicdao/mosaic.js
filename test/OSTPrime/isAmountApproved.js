const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const OSTPrime = require('../../src/ContractInteract/OSTPrime');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('OSTPrime.isAmountApproved()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
    ostPrime = new OSTPrime(web3, ostPrimeAddress);
  });

  it('should return true if account approval is equal to expected amount', async () => {
    const allowanceSpy = sinon.replace(
      ostPrime,
      'allowance',
      sinon.fake.resolves(100),
    );

    const ownerAddress = '0x0000000000000000000000000000000000000002';
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';

    const isApproved = await ostPrime.isAmountApproved(
      ownerAddress,
      spenderAddress,
      amount,
    );

    assert.isTrue(isApproved, 'Approve should return true');

    SpyAssert.assert(allowanceSpy, 1, [[ownerAddress, spenderAddress]]);
  });

  it(
    'should return true if account approval is more than expected' + ' amount',
    async () => {
      const spyAllowance = sinon.replace(
        ostPrime,
        'allowance',
        sinon.fake.resolves(200),
      );

      const ownerAddress = '0x0000000000000000000000000000000000000002';
      const spenderAddress = '0x0000000000000000000000000000000000000003';
      const amount = '100';

      const isApproved = await ostPrime.isAmountApproved(
        ownerAddress,
        spenderAddress,
        amount,
      );

      assert.isTrue(isApproved, 'Approve should return true');

      SpyAssert.assert(spyAllowance, 1, [[ownerAddress, spenderAddress]]);
      sinon.restore();
    },
  );

  it(
    'should return false if account approval is less than expected' +
      ' amount',
    async () => {
      const spyAllowance = sinon.replace(
        ostPrime,
        'allowance',
        sinon.fake.resolves(50),
      );

      const ownerAddress = '0x0000000000000000000000000000000000000002';
      const spenderAddress = '0x0000000000000000000000000000000000000003';
      const amount = '100';

      const isApproved = await ostPrime.isAmountApproved(
        ownerAddress,
        spenderAddress,
        amount,
      );

      assert.isFalse(isApproved, 'Approve should return false');

      SpyAssert.assert(spyAllowance, 1, [[ownerAddress, spenderAddress]]);
      sinon.restore();
    },
  );

  it('should throw for invalid owner address', async () => {
    const ownerAddress = '0x123';
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';

    await AssertAsync.reject(
      ostPrime.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid owner address: ${ownerAddress}.`,
    );
  });

  it('should throw for undefined owner address', async () => {
    const ownerAddress = undefined;
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';

    await AssertAsync.reject(
      ostPrime.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid owner address: ${ownerAddress}.`,
    );
  });

  it('should throw for invalid spender address', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000004';
    const spenderAddress = '0x123';
    const amount = '100';

    await AssertAsync.reject(
      ostPrime.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid spender address: ${spenderAddress}.`,
    );
  });

  it('should throw for undefined spender address', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000004';
    const spenderAddress = undefined;
    const amount = '100';

    await AssertAsync.reject(
      ostPrime.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid spender address: ${spenderAddress}.`,
    );
  });

  it('should throw for undefined amount', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000004';
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = undefined;

    await AssertAsync.reject(
      ostPrime.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid amount: ${amount}.`,
    );
  });
});
