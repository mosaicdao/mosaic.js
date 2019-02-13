'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const UtilityToken = require('../../src/ContractInteract/UtilityToken');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('UtilityToken.isAmountApproved()', () => {
  let web3;
  let utilityTokenAddress;
  let utilityToken;

  beforeEach(() => {
    web3 = new Web3();
    utilityTokenAddress = '0x0000000000000000000000000000000000000002';
    utilityToken = new UtilityToken(web3, utilityTokenAddress);
  });

  it('should return true if account approval is equal to expected amount', async () => {
    const allowanceSpy = sinon.replace(
      utilityToken,
      'allowance',
      sinon.fake.resolves(100),
    );

    const ownerAddress = '0x0000000000000000000000000000000000000002';
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';

    const isApproved = await utilityToken.isAmountApproved(
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
        utilityToken,
        'allowance',
        sinon.fake.resolves(200),
      );

      const ownerAddress = '0x0000000000000000000000000000000000000002';
      const spenderAddress = '0x0000000000000000000000000000000000000003';
      const amount = '100';

      const isApproved = await utilityToken.isAmountApproved(
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
        utilityToken,
        'allowance',
        sinon.fake.resolves(50),
      );

      const ownerAddress = '0x0000000000000000000000000000000000000002';
      const spenderAddress = '0x0000000000000000000000000000000000000003';
      const amount = '100';

      const isApproved = await utilityToken.isAmountApproved(
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
      utilityToken.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid owner address: ${ownerAddress}.`,
    );
  });

  it('should throw for undefined owner address', async () => {
    const ownerAddress = undefined;
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = '100';

    await AssertAsync.reject(
      utilityToken.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid owner address: ${ownerAddress}.`,
    );
  });

  it('should throw for invalid spender address', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000004';
    const spenderAddress = '0x123';
    const amount = '100';

    await AssertAsync.reject(
      utilityToken.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid spender address: ${spenderAddress}.`,
    );
  });

  it('should throw for undefined spender address', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000004';
    const spenderAddress = undefined;
    const amount = '100';

    await AssertAsync.reject(
      utilityToken.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid spender address: ${spenderAddress}.`,
    );
  });

  it('should throw for undefined amount', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000004';
    const spenderAddress = '0x0000000000000000000000000000000000000003';
    const amount = undefined;

    await AssertAsync.reject(
      utilityToken.isAmountApproved(ownerAddress, spenderAddress, amount),
      `Invalid amount: ${amount}.`,
    );
  });
});
