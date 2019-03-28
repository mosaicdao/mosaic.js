'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const UtilityToken = require('../../src/ContractInteract/UtilityToken');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('UtilityToken.approveRawTx()', () => {
  let web3;
  let utilityTokenAddress;
  let utilityToken;

  beforeEach(() => {
    web3 = new Web3();
    utilityTokenAddress = '0x0000000000000000000000000000000000000002';
    utilityToken = new UtilityToken(web3, utilityTokenAddress);
  });

  it('should pass with correct params', async () => {
    let mockTx = 'tx';
    const spyApprove = sinon.replace(
      utilityToken.contract.methods,
      'approve',
      sinon.fake.resolves(Promise.resolve(mockTx)),
    );

    const spyApproveRawTx = sinon.spy(utilityToken, 'approveRawTx');

    const spenderAddress = '0x0000000000000000000000000000000000000004';
    const amount = '100';

    const tx = await utilityToken.approveRawTx(spenderAddress, amount);

    assert.strictEqual(tx, mockTx, 'It must return expected tx');

    SpyAssert.assert(spyApprove, 1, [[spenderAddress, amount]]);
    SpyAssert.assert(spyApproveRawTx, 1, [[spenderAddress, amount]]);

    sinon.restore();
  });

  it('should throw for invalid spender address', async () => {
    const amount = '100';
    const spenderAddress = '0x123';

    await AssertAsync.reject(
      utilityToken.approveRawTx(spenderAddress, amount),
      `Invalid spender address: ${spenderAddress}.`,
    );
  });

  it('should throw for undefined spender address', async () => {
    const amount = '100';
    const spenderAddress = undefined;

    await AssertAsync.reject(
      utilityToken.approveRawTx(spenderAddress, amount),
      `Invalid spender address: ${spenderAddress}.`,
    );
  });

  it('should throw an error when amount is undefined', async () => {
    const spenderAddress = '0x0000000000000000000000000000000000000004';
    const amount = undefined;

    await AssertAsync.reject(
      utilityToken.approveRawTx(spenderAddress, amount),
      `Invalid approval amount: ${amount}.`,
    );
  });
});
