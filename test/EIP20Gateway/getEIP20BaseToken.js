const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

const { assert } = chai;

describe('EIP20CoGateway.getEIP20BaseToken()', () => {
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
    spyCall = sinon.spy(gateway, 'getEIP20BaseToken');
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
    const result = await gateway.getEIP20BaseToken();
    assert.strictEqual(
      result.web3,
      web3,
      'Function should return EIP20Token object with correct web3.',
    );
    assert.strictEqual(
      result.tokenAddress,
      getBaseTokenAddressResult,
      'Function should return EIP20Token object with correct contract address.',
    );

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return EIP20Token object from the instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getEIP20BaseToken();
    assert.strictEqual(
      firstCallResult.web3,
      web3,
      'Function should return EIP20Token object with correct web3.',
    );
    assert.strictEqual(
      firstCallResult.tokenAddress,
      getBaseTokenAddressResult,
      'Function should return EIP20Token object with correct contract address.',
    );

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getEIP20BaseToken();
    assert.strictEqual(
      secondCallResult.web3,
      web3,
      'Function should return EIP20Token object with correct web3.',
    );
    assert.strictEqual(
      secondCallResult.tokenAddress,
      getBaseTokenAddressResult,
      'Function should return EIP20Token object with correct contract address.',
    );

    SpyAssert.assert(spyGetBaseTokenAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);

    tearDown();
  });
});
