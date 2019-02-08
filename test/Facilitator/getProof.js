'use strict';

const chai = require('chai');
const BN = require('bn.js');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const Proof = require('../../src/utils/Proof');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const { assert } = chai;

describe('Facilitator._getProof()', () => {
  let mosaic;
  let facilitator;

  let proofGenerator;
  let accountAddress;
  let latestAnchorInfo;
  let messageHash;

  let getOutboxProofResult;

  let mockProofGenerator;
  let spyGetOutboxProof;
  let spyCall;

  let setup = () => {
    spyCall = sinon.spy(facilitator, '_getProof');
    mockProofGenerator = sinon.mock(proofGenerator);
    spyGetOutboxProof = sinon.replace(
      mockProofGenerator.object,
      'getOutboxProof',
      sinon.fake.resolves(getOutboxProofResult),
    );
  };
  let teardown = () => {
    mockProofGenerator.restore();
    sinon.restore();
    spyCall.restore();
  };
  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    proofGenerator = new Proof(mosaic.auxiliary.web3, mosaic.origin.web3);
    getOutboxProofResult = {
      encodedAccountValue: '0x1',
      serializedAccountProof: '0x2',
      storageProof: [{ serializedProof: '0x3' }],
    };
    accountAddress = '0x0000000000000000000000000000000000000001';
    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
    latestAnchorInfo = {
      blockHeight: '100',
      stateRoot:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
    };
  });

  it('should throw an error when proofGenerator object is undefined', async () => {
    await AssertAsync.reject(
      facilitator._getProof(
        undefined,
        accountAddress,
        latestAnchorInfo,
        messageHash,
      ),
      `Invalid proof generator object: ${undefined}`,
    );
  });

  it('should throw an error when account address is undefined', async () => {
    await AssertAsync.reject(
      facilitator._getProof(
        proofGenerator,
        undefined,
        latestAnchorInfo,
        messageHash,
      ),
      `Invalid account address: ${undefined}`,
    );
  });

  it('should throw an error when anchor info object is undefined', async () => {
    await AssertAsync.reject(
      facilitator._getProof(
        proofGenerator,
        accountAddress,
        undefined,
        messageHash,
      ),
      `Invalid anchor info object: ${undefined}`,
    );
  });

  it('should throw an error when anchor info object is undefined', async () => {
    await AssertAsync.reject(
      facilitator._getProof(
        proofGenerator,
        accountAddress,
        latestAnchorInfo,
        undefined,
      ),
      `Invalid message hash: ${undefined}`,
    );
  });

  it('should pass when correct params are passed', async () => {
    setup();
    const result = await facilitator._getProof(
      mockProofGenerator.object,
      accountAddress,
      latestAnchorInfo,
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
      latestAnchorInfo.blockHeight,
      "Result's block height must be equal to the mocked block height.",
    );
    assert.strictEqual(
      result.stateRoot,
      latestAnchorInfo.stateRoot,
      "Result's state root must be equal to the mocked state root.",
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
      latestAnchorInfo.blockHeight,
      `Third argument for get outbox proof call must be ${
        latestAnchorInfo.blockHeight
      }`,
    );
    SpyAssert.assert(spyCall, 1, [
      [
        mockProofGenerator.object,
        accountAddress,
        latestAnchorInfo,
        messageHash,
      ],
    ]);
    teardown();
  });
});
