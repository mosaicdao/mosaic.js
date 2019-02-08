const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

const { assert } = chai;

describe('EIP20Gateway.getAnchor()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let getStateRootProviderAddressResult;

  let spyCall;
  let spyGetStateRootProviderAddress;

  const setup = () => {
    spyGetStateRootProviderAddress = sinon.replace(
      gateway,
      'getStateRootProviderAddress',
      sinon.fake.resolves(getStateRootProviderAddressResult),
    );
    spyCall = sinon.spy(gateway, 'getAnchor');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    getStateRootProviderAddressResult =
      '0x0000000000000000000000000000000000000003';
  });

  it('should return anchor object', async () => {
    setup();
    const result = await gateway.getAnchor();
    assert.strictEqual(
      result.web3,
      web3,
      'Function should return anchor object with correct web3.',
    );
    assert.strictEqual(
      result.anchorAddress,
      getStateRootProviderAddressResult,
      'Function should return anchor object with correct anchor address.',
    );

    SpyAssert.assert(spyGetStateRootProviderAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return anchor object from the instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getAnchor();
    assert.strictEqual(
      firstCallResult.web3,
      web3,
      'Function should return anchor object with correct web3.',
    );
    assert.strictEqual(
      firstCallResult.anchorAddress,
      getStateRootProviderAddressResult,
      'Function should return anchor object with correct anchor address.',
    );

    SpyAssert.assert(spyGetStateRootProviderAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getAnchor();
    assert.strictEqual(
      secondCallResult.web3,
      web3,
      'Function should return anchor object with correct web3.',
    );
    assert.strictEqual(
      secondCallResult.anchorAddress,
      getStateRootProviderAddressResult,
      'Function should return anchor object with correct anchor address.',
    );

    SpyAssert.assert(spyGetStateRootProviderAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
