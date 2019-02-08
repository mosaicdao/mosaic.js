'use strict';

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const { assert } = chai;

describe('EIP20CoGateway._proveGatewayRawTx()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let blockHeight;
  let encodedAccount;
  let accountProof;

  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'proveGateway',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, '_proveGatewayRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    blockHeight = '123';
    encodedAccount = '0x23434334';
    accountProof = '0x34ffdff343';

    mockedTx = 'MockedTx';
  });

  it('should throw error when block height is invalid', async () => {
    await AssertAsync.reject(
      coGateway._proveGatewayRawTx(undefined, encodedAccount, accountProof),
      `Invalid block height: ${undefined}.`,
    );
  });

  it('should throw error when encoded account is invalid', async () => {
    await AssertAsync.reject(
      coGateway._proveGatewayRawTx(blockHeight, undefined, accountProof),
      `Invalid account data: ${undefined}.`,
    );
  });

  it('should throw error when account proof is invalid', async () => {
    await AssertAsync.reject(
      coGateway._proveGatewayRawTx(blockHeight, encodedAccount, undefined),
      `Invalid account proof: ${undefined}.`,
    );
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await coGateway._proveGatewayRawTx(
      blockHeight,
      encodedAccount,
      accountProof,
    );
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [
      [blockHeight, encodedAccount, accountProof],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [blockHeight, encodedAccount, accountProof],
    ]);
    tearDown();
  });
});
