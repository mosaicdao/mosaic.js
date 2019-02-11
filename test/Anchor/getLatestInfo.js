const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const Anchor = require('../../src/ContractInteract/Anchor');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('Anchor.getLatestInfo()', () => {
  let web3;
  let anchorAddress;
  let anchor;

  let getLatestStateRootBlockHeightResult;
  let getStateRootResult;

  let spyCall;
  let spyGetLatestStateRootBlockHeight;
  let spyGetStateRootResult;

  const setup = () => {
    spyCall = sinon.spy(anchor, 'getLatestInfo');
    spyGetLatestStateRootBlockHeight = sinon.replace(
      anchor,
      'getLatestStateRootBlockHeight',
      sinon.fake.resolves(getLatestStateRootBlockHeightResult),
    );
    spyGetStateRootResult = sinon.replace(
      anchor,
      'getStateRoot',
      sinon.fake.returns(getStateRootResult),
    );
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    anchorAddress = '0x0000000000000000000000000000000000000002';
    anchor = new Anchor(web3, anchorAddress);
    getLatestStateRootBlockHeightResult = 100;
    getStateRootResult =
      '0x0000000000000000000000000000000000000000000000000000000000000001';
  });

  it('should pass when called with correct arguments', async () => {
    setup();

    const result = await anchor.getLatestInfo();

    assert.strictEqual(
      result.blockHeight,
      getLatestStateRootBlockHeightResult,
      'The result.blockHeight must be equal to the mocked block height',
    );
    assert.strictEqual(
      result.stateRoot,
      getStateRootResult,
      'The result.stateRoot must be equal to the mocked state root',
    );

    SpyAssert.assert(spyCall, 1, [[]]);
    SpyAssert.assert(spyGetLatestStateRootBlockHeight, 1, [[]]);
    SpyAssert.assert(spyGetStateRootResult, 1, [
      [getLatestStateRootBlockHeightResult],
    ]);

    tearDown();
  });
});
