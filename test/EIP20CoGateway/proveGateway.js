const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const Utils = require('../../src/utils/Utils');

describe('EIP20CoGateway.proveGateway()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let txOptions;
  let blockHeight;
  let encodedAccount;
  let accountProof;

  let mockedTx;

  let spyRawTx;
  let spyCall;
  let spySendTransaction;

  const setup = () => {
    spyRawTx = sinon.replace(
      coGateway,
      '_proveGatewayRawTx',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, 'proveGateway');

    spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    txOptions = {
      from: '0x0000000000000000000000000000000000000003',
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };

    blockHeight = '123';
    encodedAccount = '0x23434334';
    accountProof = '0x34ffdff343';

    mockedTx = 'MockedTx';
  });

  it('should throw error transaction object is invalid', async () => {
    await AssertAsync.reject(
      coGateway.proveGateway(
        blockHeight,
        encodedAccount,
        accountProof,
        undefined,
      ),
      `Invalid transaction options: ${undefined}.`,
    );
  });

  it('should throw error when `from` address is undefined in transaction object', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      coGateway.proveGateway(
        blockHeight,
        encodedAccount,
        accountProof,
        txOptions,
      ),
      `Invalid from address ${txOptions.from} in transaction options.`,
    );
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await coGateway.proveGateway(
      blockHeight,
      encodedAccount,
      accountProof,
      txOptions,
    );
    assert.strictEqual(result, true, 'Result must be true.');

    SpyAssert.assert(spyRawTx, 1, [
      [blockHeight, encodedAccount, accountProof],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [blockHeight, encodedAccount, accountProof, txOptions],
    ]);
    SpyAssert.assert(spySendTransaction, 1, [[mockedTx, txOptions]]);
    tearDown();
  });
});
