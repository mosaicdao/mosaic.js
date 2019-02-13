'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const UtilityToken = require('../../src/ContractInteract/UtilityToken');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('UtilityToken.balanceOf()', () => {
  let web3;
  let utilityTokenAddress;
  let utilityToken;

  beforeEach(() => {
    web3 = new Web3();
    utilityTokenAddress = '0x0000000000000000000000000000000000000002';
    utilityToken = new UtilityToken(web3, utilityTokenAddress);
  });

  it('should pass with correct params', async () => {
    let balance = '100';

    const spyContractBalanceOf = sinon.replace(
      utilityToken.contract.methods,
      'balanceOf',
      sinon.fake.returns({
        call: () => Promise.resolve(balance),
      }),
    );

    const spyOSTPrimeBalanceOf = sinon.spy(utilityToken, 'balanceOf');

    const accountAddress = '0x0000000000000000000000000000000000000003';

    const result = await utilityToken.balanceOf(accountAddress);

    assert.strictEqual(result, balance, 'It must return expected balance');

    SpyAssert.assert(spyContractBalanceOf, 1, [[accountAddress]]);
    SpyAssert.assert(spyOSTPrimeBalanceOf, 1, [[accountAddress]]);

    sinon.restore();
  });

  it('should throw for invalid account address', async () => {
    const accountAddress = '0x123';

    await AssertAsync.reject(
      utilityToken.balanceOf(accountAddress),
      `Invalid address: ${accountAddress}.`,
    );
  });

  it('should throw for undefined account address', async () => {
    const accountAddress = undefined;

    await AssertAsync.reject(
      utilityToken.balanceOf(accountAddress),
      `Invalid address: ${accountAddress}.`,
    );
  });
});
