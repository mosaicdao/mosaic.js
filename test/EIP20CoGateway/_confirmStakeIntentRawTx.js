'use strict';

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const { assert } = chai;

describe('EIP20CoGateway._confirmStakeIntentRawTx()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let stakeParams;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'confirmStakeIntent',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, '_confirmStakeIntentRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    stakeParams = {
      staker: '0x0000000000000000000000000000000000000005',
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: '0xhashlock',
      blockHeight: '12345',
      storageProof: '0x123',
    };
    mockedTx = 'MockedTx';
  });

  it('should throw error when staker address is invalid', async () => {
    await AssertAsync.reject(
      coGateway._confirmStakeIntentRawTx(
        undefined,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ),
      `Invalid staker address: ${undefined}.`,
    );
  });

  it('should throw error when nonce is invalid', async () => {
    await AssertAsync.reject(
      coGateway._confirmStakeIntentRawTx(
        stakeParams.staker,
        undefined,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ),
      `Invalid nonce: ${undefined}.`,
    );
  });

  it('should throw error when beneficiary address is undefined', async () => {
    await AssertAsync.reject(
      coGateway._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        undefined,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ),
      `Invalid beneficiary address: ${undefined}.`,
    );
  });

  it('should throw error when stake amount is invalid', async () => {
    await AssertAsync.reject(
      coGateway._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ),
      `Invalid stake amount: ${undefined}.`,
    );
  });

  it('should throw error when gas price is invalid', async () => {
    await AssertAsync.reject(
      coGateway._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        undefined,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ),
      `Invalid gas price: ${undefined}.`,
    );
  });

  it('should throw error when gas limit is invalid', async () => {
    await AssertAsync.reject(
      coGateway._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        undefined,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ),
      `Invalid gas limit: ${undefined}.`,
    );
  });

  it('should throw error when block height is invalid', async () => {
    await AssertAsync.reject(
      coGateway._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        undefined,
        stakeParams.storageProof,
      ),
      `Invalid block height: ${undefined}.`,
    );
  });

  it('should throw error when storage proof is invalid', async () => {
    await AssertAsync.reject(
      coGateway._confirmStakeIntentRawTx(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        undefined,
      ),
      `Invalid storage proof data: ${undefined}.`,
    );
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await coGateway._confirmStakeIntentRawTx(
      stakeParams.staker,
      stakeParams.nonce,
      stakeParams.beneficiary,
      stakeParams.amount,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.hashLock,
      stakeParams.blockHeight,
      stakeParams.storageProof,
    );
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ],
    ]);

    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ],
    ]);
    tearDown();
  });
});
