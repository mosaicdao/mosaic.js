'use strict';

const { assert } = require('chai');
const BN = require('bn.js');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const ProofGenerator = require('../../src/utils/ProofGenerator');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('Facilitator._getProof()', () => {
  let mosaic;

  let proofGenerator;
  let accountAddress;
  let blockNumber;
  let messageHash;

  let getOutboxProofResult;

  let mockProofGenerator;
  let spyGetOutboxProof;
  let spyCall;

  const setup = () => {
    spyCall = sinon.spy(Facilitator, '_getProof');
    mockProofGenerator = sinon.mock(proofGenerator);
    spyGetOutboxProof = sinon.replace(
      mockProofGenerator.object,
      'getOutboxProof',
      sinon.fake.resolves(getOutboxProofResult),
    );
  };
  const teardown = () => {
    mockProofGenerator.restore();
    sinon.restore();
    spyCall.restore();
  };
  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    proofGenerator = new ProofGenerator(
      mosaic.auxiliary.web3,
      mosaic.origin.web3,
    );
    getOutboxProofResult = {
      encodedAccountValue: '0x1',
      serializedAccountProof: '0x2',
      storageProof: [{ serializedProof: '0x3' }],
    };
    accountAddress = '0x0000000000000000000000000000000000000001';
    messageHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    blockNumber = '100';
  });

  it('should throw an error when proofGenerator object is undefined', async () => {
    await AssertAsync.reject(
      Facilitator._getProof(
        undefined,
        accountAddress,
        blockNumber,
        messageHash,
      ),
      `Invalid proof generator object: ${undefined}`,
    );
  });

  it('should throw an error when account address is undefined', async () => {
    await AssertAsync.reject(
      Facilitator._getProof(
        proofGenerator,
        undefined,
        blockNumber,
        messageHash,
      ),
      `Invalid account address: ${undefined}`,
    );
  });

  it('should throw an error when anchor info object is undefined', async () => {
    await AssertAsync.reject(
      Facilitator._getProof(
        proofGenerator,
        accountAddress,
        undefined,
        messageHash,
      ),
      `Invalid block number: ${undefined}`,
    );
  });

  it('should throw an error when anchor info object is undefined', async () => {
    await AssertAsync.reject(
      Facilitator._getProof(
        proofGenerator,
        accountAddress,
        blockNumber,
        undefined,
      ),
      `Invalid message hash: ${undefined}`,
    );
  });

  it('should pass when correct params are passed', async () => {
    setup();
    const result = await Facilitator._getProof(
      mockProofGenerator.object,
      accountAddress,
      blockNumber,
      messageHash,
    );

    assert.strictEqual(
      result.accountData,
      getOutboxProofResult.encodedAccountValue,
      "Result's account data must be equal to the mocked account data.",
    );
    assert.strictEqual(
      result.accountProof,
      getOutboxProofResult.serializedAccountProof,
      "Result's account proof must be equal to the mocked account proof.",
    );
    assert.strictEqual(
      result.storageProof,
      getOutboxProofResult.storageProof[0].serializedProof,
      "Result's storage proof must be equal to the mocked storage proof.",
    );
    assert.strictEqual(
      result.blockNumber,
      blockNumber,
      "Result's block height must be equal to the mocked block height.",
    );
    assert.strictEqual(
      spyGetOutboxProof.args[0][0],
      accountAddress,
      `First argument for get outbox proof call must be ${accountAddress}`,
    );
    assert.equal(
      spyGetOutboxProof.args[0][1][0],
      messageHash,
      `Second argument for get outbox proof call must be ${messageHash}`,
    );
    assert.strictEqual(
      new BN(spyGetOutboxProof.args[0][2].slice(2), 16).toString(10),
      blockNumber,
      `Third argument for get outbox proof call must be ${blockNumber}`,
    );
    SpyAssert.assert(spyCall, 1, [
      [
        mockProofGenerator.object,
        accountAddress,
        blockNumber,
        messageHash,
      ],
    ]);
    teardown();
  });
});
