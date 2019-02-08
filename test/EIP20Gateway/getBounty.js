const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Gateway.getBounty()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let mockedBountyAmount;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'bounty',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedBountyAmount);
      }),
    );

    spyCall = sinon.spy(gateway, 'getBounty');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    mockedBountyAmount = '10000';
  });

  it('should return correct mocked bounty amount', async () => {
    setup();
    const result = await gateway.getBounty();
    assert.strictEqual(
      result,
      mockedBountyAmount,
      'Function should return mocked bounty amount.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return correct bounty amount from instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getBounty();
    assert.strictEqual(
      firstCallResult,
      mockedBountyAmount,
      'Function should return mocked bounty amount.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getBounty();
    assert.strictEqual(
      secondCallResult,
      mockedBountyAmount,
      'Function should return mocked bounty amount.',
    );

    // Check if the method was not called this time.
    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
