'use strict';

const { assert } = require('chai');
const sinon = require('sinon');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('Facilitator.getGatewayProof()', () => {
  let mosaic;
  let facilitator;
  let messageHash;
  let blockNumber;

  let getLatestAnchorInfoResult;
  let getProofResult;

  let spyGetProof;
  let spyCall;

  const setup = () => {
    spyCall = sinon.spy(facilitator, 'getGatewayProof');
    spyGetProof = sinon.replace(
      Facilitator,
      '_getProof',
      sinon.fake.resolves(getProofResult),
    );
  };

  const teardown = () => {
    spyCall.restore();
    sinon.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    messageHash = '0x0000000000000000000000000000000000000000000000000000000000000001';
    blockNumber = '100';
    getLatestAnchorInfoResult = { blockHeight: blockNumber };
    getProofResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    await AssertAsync.reject(
      facilitator.getGatewayProof(undefined, blockNumber),
      'Invalid message hash: undefined.',
    );
  });

  it('should throw an error when blockNumber is undefined', async () => {
    await AssertAsync.reject(
      facilitator.getGatewayProof(messageHash, undefined),
      'Invalid block height: undefined.',
    );
  });

  it('should pass with valid arguments', async () => {
    setup();
    const result = await facilitator.getGatewayProof(messageHash, blockNumber);
    assert.strictEqual(
      result,
      getProofResult,
      'Result of getGatewayProof must be true.',
    );

    SpyAssert.assert(spyCall, 1, [[messageHash, blockNumber]]);
    SpyAssert.assertCall(spyGetProof, 1);

    assert.strictEqual(
      typeof spyGetProof.args[0][0],
      'object',
      'First argument for get proof call must be object',
    );

    assert.strictEqual(
      spyGetProof.args[0][1],
      facilitator.gateway.address,
      'Second argument for get proof call must be gateway contract address',
    );

    assert.deepEqual(
      spyGetProof.args[0][2],
      getLatestAnchorInfoResult,
      'Third argument for get proof call must be the anchorInfo object',
    );

    assert.strictEqual(
      spyGetProof.args[0][3],
      messageHash,
      'Fourth argument for get proof call must be the message hash',
    );

    teardown();
  });
});
