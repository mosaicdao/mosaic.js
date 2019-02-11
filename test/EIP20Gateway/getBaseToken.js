const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Gateway.getBaseToken()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let mockedBaseTokenAddress;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'baseToken',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedBaseTokenAddress);
      }),
    );

    spyCall = sinon.spy(gateway, 'getBaseToken');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    mockedBaseTokenAddress = '0x0000000000000000000000000000000000000003';
  });

  it('should return correct base token address', async () => {
    setup();
    const result = await gateway.getBaseToken();
    assert.strictEqual(
      result,
      mockedBaseTokenAddress,
      'Function should return mocked base token address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return correct base token address from instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getBaseToken();
    assert.strictEqual(
      firstCallResult,
      mockedBaseTokenAddress,
      'Function should return mocked base token address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getBaseToken();
    assert.strictEqual(
      secondCallResult,
      mockedBaseTokenAddress,
      'Function should return mocked base token address.',
    );

    // Check if the method was not called this time.
    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
