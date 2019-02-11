'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20CoGateway.getUtilityTokenContract()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let getUtilityTokenAddressResult;

  let spyCall;
  let spyGetUtilityTokenAddress;

  const setup = () => {
    spyGetUtilityTokenAddress = sinon.replace(
      coGateway,
      'getUtilityToken',
      sinon.fake.resolves(getUtilityTokenAddressResult),
    );
    spyCall = sinon.spy(coGateway, 'getUtilityTokenContract');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);
    getUtilityTokenAddressResult =
      '0x0000000000000000000000000000000000000003';
  });

  it('should return UtilityToken contract object', async () => {
    setup();
    const result = await coGateway.getUtilityTokenContract();
    assert.strictEqual(
      result.web3,
      web3,
      'Function should return UtilityToken contract object with correct web3.',
    );
    assert.strictEqual(
      result.tokenAddress,
      getUtilityTokenAddressResult,
      'Function should return UtilityToken contract object with correct contract address.',
    );

    SpyAssert.assert(spyGetUtilityTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return already created UtilityToken contract object instead of creating new object', async () => {
    setup();
    const firstCallResult = await coGateway.getUtilityTokenContract();
    assert.strictEqual(
      firstCallResult.web3,
      web3,
      'Function should return UtilityToken contract object with correct web3.',
    );
    assert.strictEqual(
      firstCallResult.tokenAddress,
      getUtilityTokenAddressResult,
      'Function should return UtilityToken contract object with correct contract address.',
    );

    SpyAssert.assert(spyGetUtilityTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await coGateway.getUtilityTokenContract();
    assert.strictEqual(
      secondCallResult.web3,
      web3,
      'Function should return UtilityToken contract object with correct web3.',
    );
    assert.strictEqual(
      secondCallResult.tokenAddress,
      getUtilityTokenAddressResult,
      'Function should return UtilityToken contract object with correct contract address.',
    );

    SpyAssert.assert(spyGetUtilityTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);

    tearDown();
  });
});
