'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20CoGateway.getValueTokenContract()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let getValueTokenAddressResult;

  let spyCall;
  let spyGetValueTokenAddress;

  const setup = () => {
    spyGetValueTokenAddress = sinon.replace(
      gateway,
      'getValueToken',
      sinon.fake.resolves(getValueTokenAddressResult),
    );
    spyCall = sinon.spy(gateway, 'getValueTokenContract');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    getValueTokenAddressResult = '0x0000000000000000000000000000000000000003';
  });

  it('should return value token contact object', async () => {
    setup();
    const result = await gateway.getValueTokenContract();
    assert.strictEqual(
      result.web3,
      web3,
      'Function should return value token contact object with correct web3.',
    );
    assert.strictEqual(
      result.tokenAddress,
      getValueTokenAddressResult,
      'Function should return value token contact object with correct contract address.',
    );

    SpyAssert.assert(spyGetValueTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return value token contact object from the instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getValueTokenContract();
    assert.strictEqual(
      firstCallResult.web3,
      web3,
      'Function should return value token contact object with correct web3.',
    );
    assert.strictEqual(
      firstCallResult.tokenAddress,
      getValueTokenAddressResult,
      'Function should return value token contact object with correct contract address.',
    );

    SpyAssert.assert(spyGetValueTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getValueTokenContract();
    assert.strictEqual(
      secondCallResult.web3,
      web3,
      'Function should return value token contact object with correct web3.',
    );
    assert.strictEqual(
      secondCallResult.tokenAddress,
      getValueTokenAddressResult,
      'Function should return value token contact object with correct contract address.',
    );

    SpyAssert.assert(spyGetValueTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);

    tearDown();
  });
});
