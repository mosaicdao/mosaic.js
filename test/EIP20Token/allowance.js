const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('EIP20Token.allowance()', () => {
  let web3;
  let tokenAddress;
  let token;
  let ownerAccountAddress;
  let spenderAccountAddress;

  let mockedAllowanceValue;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      token.contract.methods,
      'allowance',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedAllowanceValue);
      }),
    );
    spyCall = sinon.spy(token, 'allowance');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    tokenAddress = '0x0000000000000000000000000000000000000002';
    token = new EIP20Token(web3, tokenAddress);
    ownerAccountAddress = '0x0000000000000000000000000000000000000003';
    spenderAccountAddress = '0x0000000000000000000000000000000000000004';
    mockedAllowanceValue = '100';
  });

  it('should throw an error when owner account address is undefined', async () => {
    await AssertAsync.reject(
      token.allowance(undefined, spenderAccountAddress),
      `Owner address is invalid or missing: ${undefined}.`,
    );
  });

  it('should throw an error when account address is undefined', async () => {
    await AssertAsync.reject(
      token.allowance(ownerAccountAddress, undefined),
      `Spender address is invalid or missing: ${undefined}`,
    );
  });

  it('should return mocked allowance value', async () => {
    setup();
    const result = await token.allowance(
      ownerAccountAddress,
      spenderAccountAddress,
    );

    assert.strictEqual(
      result,
      mockedAllowanceValue,
      'Allowance must be equal to mocked allowance.',
    );
    SpyAssert.assert(spyMethod, 1, [
      [ownerAccountAddress, spenderAccountAddress],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [ownerAccountAddress, spenderAccountAddress],
    ]);
    tearDown();
  });
});
