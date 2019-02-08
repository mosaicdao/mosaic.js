const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Gateway._stakeRawTx()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let stakeParams;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'stake',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(gateway, '_stakeRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);

    stakeParams = {
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: '0xhashlock',
    };

    mockedTx = 'MockedTx';
  });

  it('should throw error when stake amount is zero', async function() {
    const expectedErrorMessage = `Stake amount must be greater than zero: 0.`;
    await gateway
      ._stakeRawTx(
        '0',
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when beneficiary address is invalid', async function() {
    const expectedErrorMessage = `Invalid beneficiary address: 0x123.`;
    await gateway
      ._stakeRawTx(
        stakeParams.amount,
        '0x123',
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when gas price is undefined', async function() {
    const expectedErrorMessage = `Invalid gas price: ${undefined}.`;
    await gateway
      ._stakeRawTx(
        stakeParams.amount,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when gas limit is undefined', async function() {
    const expectedErrorMessage = `Invalid gas limit: ${undefined}.`;
    await gateway
      ._stakeRawTx(
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        undefined,
        stakeParams.nonce,
        stakeParams.hashLock,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await gateway._stakeRawTx(
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.nonce,
      stakeParams.hashLock,
    );
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.nonce,
        stakeParams.hashLock,
      ],
    ]);
    tearDown();
  });
});
