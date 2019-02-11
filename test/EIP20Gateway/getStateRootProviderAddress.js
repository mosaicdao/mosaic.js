const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Gateway.getStateRootProviderAddress()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let mockedStateRootProviderAddress;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'stateRootProvider',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedStateRootProviderAddress);
      }),
    );

    spyCall = sinon.spy(gateway, 'getStateRootProviderAddress');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    mockedStateRootProviderAddress =
      '0x0000000000000000000000000000000000000004';
  });

  it('should return correct state root provider address', async () => {
    setup();
    const result = await gateway.getStateRootProviderAddress();
    assert.strictEqual(
      result,
      mockedStateRootProviderAddress,
      'Function should return mocked state root provider address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return correct state root provider address from instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getStateRootProviderAddress();
    assert.strictEqual(
      firstCallResult,
      mockedStateRootProviderAddress,
      'Function should return mocked state root provider address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getStateRootProviderAddress();
    assert.strictEqual(
      secondCallResult,
      mockedStateRootProviderAddress,
      'Function should return mocked state root provider address.',
    );

    // Check if the method was not called this time.
    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
