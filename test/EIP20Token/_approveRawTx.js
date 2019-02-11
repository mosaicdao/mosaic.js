'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('EIP20Token._approveRawTx()', () => {
  let web3;
  let tokenAddress;
  let token;

  let spenderAddress;
  let amount;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      token.contract.methods,
      'approve',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(token, '_approveRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    tokenAddress = '0x0000000000000000000000000000000000000002';
    token = new EIP20Token(web3, tokenAddress);

    spenderAddress = '0x0000000000000000000000000000000000000005';
    amount = '1000';
    mockedTx = 'MockedTx';
  });

  it('should throw an error when spender address is undefined', async () => {
    await AssertAsync.reject(
      token._approveRawTx(undefined, amount),
      'Invalid spender address: undefined.',
    );
  });

  it('should throw an error when amount is undefined', async () => {
    await AssertAsync.reject(
      token._approveRawTx(spenderAddress, undefined),
      'Invalid approval amount: undefined.',
    );
  });

  it('should return transaction object', async () => {
    setup();
    const result = await token._approveRawTx(spenderAddress, amount);

    assert.strictEqual(
      result,
      mockedTx,
      'Mocked transaction object must be returned.',
    );
    SpyAssert.assert(spyMethod, 1, [[spenderAddress, amount]]);
    SpyAssert.assert(spyCall, 1, [[spenderAddress, amount]]);
    tearDown();
  });
});
