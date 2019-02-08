const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const { assert } = chai;

describe('EIP20Gateway.isStakeAmountApproved()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let staker;
  let amount;
  let valueTokenAddress;
  let mockedResult;

  let mockedValueToken;
  let spyGetEIP20ValueToken;
  let spyIsAmountApproved;
  let spyCall;

  const setup = () => {
    const token = new EIP20Token(web3, valueTokenAddress);
    mockedValueToken = sinon.mock(token);
    spyGetEIP20ValueToken = sinon.replace(
      gateway,
      'getEIP20ValueToken',
      sinon.fake.resolves(mockedValueToken.object),
    );
    spyIsAmountApproved = sinon.replace(
      mockedValueToken.object,
      'isAmountApproved',
      sinon.fake.returns(mockedResult),
    );
    spyCall = sinon.spy(gateway, 'isStakeAmountApproved');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
    mockedValueToken.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);

    staker = '0x0000000000000000000000000000000000000005';
    amount = '1000';
    valueTokenAddress = '0x0000000000000000000000000000000000000004';
    mockedResult = true;
  });

  it('should throw an error when staker address is undefined', async () => {
    await AssertAsync.reject(
      gateway.isStakeAmountApproved(undefined, amount),
      `Invalid staker address: ${undefined}.`,
    );
  });

  it('should throw an error when amount is undefined', async () => {
    await AssertAsync.reject(
      gateway.isStakeAmountApproved(staker, undefined),
      `Invalid stake amount: ${undefined}.`,
    );
  });

  it('should pass with correct params', async () => {
    setup();
    const result = await gateway.isStakeAmountApproved(staker, amount);
    assert.strictEqual(
      result,
      true,
      'Result of isStakeAmountApproved must be true.',
    );

    SpyAssert.assert(spyGetEIP20ValueToken, 1, [[]]);
    SpyAssert.assert(spyIsAmountApproved, 1, [
      [staker, gatewayAddress, amount],
    ]);
    SpyAssert.assert(spyCall, 1, [[staker, amount]]);
    tearDown();
  });
});
