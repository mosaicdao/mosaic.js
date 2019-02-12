'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('EIP20Token.isAmountApproved()', () => {
  let web3;
  let token;
  let ownerAddress;
  let spenderAddress;
  let amount;
  let address;
  let mockedAllowance;

  let spyAllowance;
  let spyCall;

  const setup = () => {
    spyAllowance = sinon.replace(
      token,
      'allowance',
      sinon.fake.resolves(mockedAllowance),
    );
    spyCall = sinon.spy(token, 'isAmountApproved');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    ownerAddress = '0x0000000000000000000000000000000000000005';
    spenderAddress = '0x0000000000000000000000000000000000000007';
    amount = '1000';
    address = '0x0000000000000000000000000000000000000004';
    mockedAllowance = '10000';
    token = new EIP20Token(web3, address);
  });

  it('should throw an error when owner address is undefined', async () => {
    await AssertAsync.reject(
      token.isAmountApproved(undefined, spenderAddress, amount),
      'Invalid owner address: undefined.',
    );
  });

  it('should throw an error when spender address is undefined', async () => {
    await AssertAsync.reject(
      token.isAmountApproved(ownerAddress, undefined, amount),
      'Invalid spender address: undefined.',
    );
  });

  it('should throw an error when amount is undefined', async () => {
    await AssertAsync.reject(
      token.isAmountApproved(ownerAddress, spenderAddress, undefined),
      'Invalid amount: undefined.',
    );
  });

  it('should return true when allowance amount is less than the given amount', async () => {
    setup();
    const result = await token.isAmountApproved(
      ownerAddress,
      spenderAddress,
      amount,
    );
    assert.strictEqual(
      result,
      true,
      'Result of isAmountApproved must be true.',
    );

    SpyAssert.assert(spyAllowance, 1, [[ownerAddress, spenderAddress]]);
    SpyAssert.assert(spyCall, 1, [[ownerAddress, spenderAddress, amount]]);
    tearDown();
  });

  it('should return true when allowance amount is equal to the given amount', async () => {
    mockedAllowance = amount;
    setup();
    const result = await token.isAmountApproved(
      ownerAddress,
      spenderAddress,
      amount,
    );
    assert.strictEqual(
      result,
      true,
      'Result of isAmountApproved must be true.',
    );

    SpyAssert.assert(spyAllowance, 1, [[ownerAddress, spenderAddress]]);
    SpyAssert.assert(spyCall, 1, [[ownerAddress, spenderAddress, amount]]);
    tearDown();
  });

  it('should return false when allowance amount is greater than the given amount', async () => {
    mockedAllowance = '10';
    setup();
    const result = await token.isAmountApproved(
      ownerAddress,
      spenderAddress,
      amount,
    );
    assert.strictEqual(
      result,
      false,
      'Result of isAmountApproved must be true.',
    );

    SpyAssert.assert(spyAllowance, 1, [[ownerAddress, spenderAddress]]);
    SpyAssert.assert(spyCall, 1, [[ownerAddress, spenderAddress, amount]]);
    tearDown();
  });
});
