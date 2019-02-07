const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const assert = chai.assert;
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20CoGateway.getStateRootProviderAddress()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let mockedStateRootProviderAddress;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'stateRootProvider',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedStateRootProviderAddress);
      }),
    );

    spyCall = sinon.spy(coGateway, 'getStateRootProviderAddress');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);
    mockedStateRootProviderAddress =
      '0x0000000000000000000000000000000000000004';
  });

  it('should return correct state root provider address', async () => {
    setup();
    const result = await coGateway.getStateRootProviderAddress();
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
    const firstCallResult = await coGateway.getStateRootProviderAddress();
    assert.strictEqual(
      firstCallResult,
      mockedStateRootProviderAddress,
      'Function should return mocked state root provider address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await coGateway.getStateRootProviderAddress();
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
