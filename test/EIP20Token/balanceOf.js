const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const { assert } = chai;

describe('EIP20Token.balanceOf()', () => {
  let web3;
  let tokenAddress;
  let token;
  let accountAddress;
  let mockedBalance;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      token.contract.methods,
      'balanceOf',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedBalance);
      }),
    );
    spyCall = sinon.spy(token, 'balanceOf');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    tokenAddress = '0x0000000000000000000000000000000000000002';
    token = new EIP20Token(web3, tokenAddress);
    accountAddress = '0x0000000000000000000000000000000000000003';
    mockedBalance = '100';
  });

  it('should throw an error when account address is undefined', async () => {
    await AssertAsync.reject(
      token.balanceOf(undefined),
      `Invalid address: ${undefined}.`,
    );
  });

  it('should return mocked balance value', async () => {
    setup();
    const result = await token.balanceOf(accountAddress);

    assert.strictEqual(
      result,
      mockedBalance,
      'Result balance must be equal to mocked balance.',
    );
    SpyAssert.assert(spyMethod, 1, [[accountAddress]]);
    SpyAssert.assert(spyCall, 1, [[accountAddress]]);
    tearDown();
  });
});
