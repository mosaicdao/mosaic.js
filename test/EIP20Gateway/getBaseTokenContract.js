'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20CoGateway.getBaseTokenContract()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let getBaseTokenAddressResult;

  let spyCall;
  let spyGetBaseTokenAddress;

  const setup = () => {
    spyGetBaseTokenAddress = sinon.replace(
      gateway,
      'getBaseToken',
      sinon.fake.resolves(getBaseTokenAddressResult),
    );
    spyCall = sinon.spy(gateway, 'getBaseTokenContract');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    getBaseTokenAddressResult = '0x0000000000000000000000000000000000000003';
  });

  it('should return EIP20Token object', async () => {
    setup();
    const result = await gateway.getBaseTokenContract();
    assert.strictEqual(
      result.web3,
      web3,
      'Function should return EIP20Token object with correct web3.',
    );
    assert.strictEqual(
      result.address,
      getBaseTokenAddressResult,
      'Function should return EIP20Token object with correct contract address.',
    );

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return base token contract object from the instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getBaseTokenContract();
    assert.strictEqual(
      firstCallResult.web3,
      web3,
      'Function should return base token contract object with correct web3.',
    );
    assert.strictEqual(
      firstCallResult.address,
      getBaseTokenAddressResult,
      'Function should return base token contract object with correct contract address.',
    );

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getBaseTokenContract();
    assert.strictEqual(
      secondCallResult.web3,
      web3,
      'Function should return base token contract object with correct web3.',
    );
    assert.strictEqual(
      secondCallResult.address,
      getBaseTokenAddressResult,
      'Function should return base token contract object with correct contract address.',
    );

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);

    tearDown();
  });
});
