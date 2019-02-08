const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('EIP20CoGateway.isRedeemAmountApproved()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let redeemParams;
  let mockedResult;

  let spyMethod;
  let mockUtilityToken;

  const setup = () => {
    mockUtilityToken = sinon.createStubInstance(EIP20Token);

    sinon.replace(
      coGateway,
      'getEIP20UtilityToken',
      sinon.fake.resolves(mockUtilityToken),
    );

    sinon.replace(
      mockUtilityToken,
      'isAmountApproved',
      sinon.fake.resolves(mockedResult),
    );

    spyMethod = sinon.spy(coGateway, 'isRedeemAmountApproved');
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    redeemParams = {
      amount: '1000000000000',
      redeemer: '0x0000000000000000000000000000000000000004',
    };

    mockedResult = true;
  });

  it('should throw for invalid address', async () => {
    const message = `Invalid redemeer address: ${'0x123'}.`;

    await AssertAsync.reject(
      coGateway.isRedeemAmountApproved('0x123', redeemParams.amount),
      message,
    );
  });

  it('should throw for invalid amount', async () => {
    const message = `Invalid redeem amount: ${undefined}.`;

    await AssertAsync.reject(
      coGateway.isRedeemAmountApproved(redeemParams.redeemer, undefined),
      message,
    );
  });

  it('should return correct result', async () => {
    setup();

    const result = await coGateway.isRedeemAmountApproved(
      redeemParams.redeemer,
      redeemParams.amount,
    );

    assert.strictEqual(result, true, 'Function should return true.');

    SpyAssert.assert(spyMethod, 1, [
      [redeemParams.redeemer, redeemParams.amount],
    ]);

    SpyAssert.assert(mockUtilityToken.isAmountApproved, 1, [
      [redeemParams.redeemer, coGatewayAddress, redeemParams.amount],
    ]);
  });
});
