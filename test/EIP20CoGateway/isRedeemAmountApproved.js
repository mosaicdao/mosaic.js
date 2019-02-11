const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('EIP20CoGateway.isRedeemAmountApproved()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let redeemer;
  let amount;
  let utilityTokenAddress;
  let mockedResult;

  let mockedUtilityToken;
  let spyGetEIP20UtilityToken;
  let spyIsAmountApproved;
  let spyCall;

  const setup = () => {
    const token = new EIP20Token(web3, utilityTokenAddress);
    mockedUtilityToken = sinon.mock(token);
    spyGetEIP20UtilityToken = sinon.replace(
      coGateway,
      'getEIP20UtilityToken',
      sinon.fake.resolves(mockedUtilityToken.object),
    );
    spyIsAmountApproved = sinon.replace(
      mockedUtilityToken.object,
      'isAmountApproved',
      sinon.fake.returns(mockedResult),
    );
    spyCall = sinon.spy(coGateway, 'isRedeemAmountApproved');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
    mockedUtilityToken.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    redeemer = '0x0000000000000000000000000000000000000005';
    amount = '1000';
    utilityTokenAddress = '0x0000000000000000000000000000000000000004';
    mockedResult = true;
  });

  it('should throw an error when redeemer address is undefined', async () => {
    await AssertAsync.reject(
      coGateway.isRedeemAmountApproved(undefined, amount),
      'Invalid redeemer address: undefined.',
    );
  });

  it('should throw an error when amount is undefined', async () => {
    await AssertAsync.reject(
      coGateway.isRedeemAmountApproved(redeemer, undefined),
      'Invalid redeem amount: undefined.',
    );
  });

  it('should pass with correct params', async () => {
    setup();
    const result = await coGateway.isRedeemAmountApproved(redeemer, amount);
    assert.strictEqual(
      result,
      true,
      'Result of isRedeemAmountApproved must be true.',
    );

    SpyAssert.assert(spyGetEIP20UtilityToken, 1, [[]]);
    SpyAssert.assert(spyIsAmountApproved, 1, [
      [redeemer, coGatewayAddress, amount],
    ]);
    SpyAssert.assert(spyCall, 1, [[redeemer, amount]]);
    tearDown();
  });
});
