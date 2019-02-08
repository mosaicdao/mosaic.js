const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Gateway.getValueToken()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let mockedValueTokenAddress;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'token',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedValueTokenAddress);
      }),
    );

    spyCall = sinon.spy(gateway, 'getValueToken');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    mockedValueTokenAddress = '0x0000000000000000000000000000000000000003';
  });

  it('should return correct mocked value token address', async () => {
    setup();
    const result = await gateway.getValueToken();
    assert.strictEqual(
      result,
      mockedValueTokenAddress,
      'Function should return mocked value token address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return correct value token address from instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getValueToken();
    assert.strictEqual(
      firstCallResult,
      mockedValueTokenAddress,
      'Function should return mocked value token address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getValueToken();
    assert.strictEqual(
      secondCallResult,
      mockedValueTokenAddress,
      'Function should return mocked value token address.',
    );

    // Check if the method was not called this time.
    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
