const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20CoGateway.getValueToken()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let mockedUtilityTokenAddress;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'utilityToken',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedUtilityTokenAddress);
      }),
    );

    spyCall = sinon.spy(coGateway, 'getUtilityToken');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);
    mockedUtilityTokenAddress = '0x0000000000000000000000000000000000000003';
  });

  it('should return correct utility token address', async () => {
    setup();
    const result = await coGateway.getUtilityToken();
    assert.strictEqual(
      result,
      mockedUtilityTokenAddress,
      'Function should return mocked utility token address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return already created utility token instead of creating new', async () => {
    setup();
    const firstCallResult = await coGateway.getUtilityToken();
    assert.strictEqual(
      firstCallResult,
      mockedUtilityTokenAddress,
      'Function should return mocked utility token address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await coGateway.getUtilityToken();
    assert.strictEqual(
      secondCallResult,
      mockedUtilityTokenAddress,
      'Function should return mocked utility token address.',
    );

    // Check if the method was not called this time.
    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
