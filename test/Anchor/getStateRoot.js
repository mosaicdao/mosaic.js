const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const Anchor = require('../../src/ContractInteract/Anchor');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('Anchor.getStateRoot()', () => {
  let web3;
  let anchorAddress;
  let anchor;

  beforeEach(() => {
    web3 = new Web3();
    anchorAddress = '0x0000000000000000000000000000000000000002';
    anchor = new Anchor(web3, anchorAddress);
  });

  it('should pass when called with correct arguments', async () => {
    let blockHeight = '10';
    let stateRoot = web3.utils.sha3('1');

    let spyMethod = sinon.replace(
      anchor.contract.methods,
      'getStateRoot',
      sinon.fake.returns({
        call: () => Promise.resolve(stateRoot),
      }),
    );

    let result = await anchor.getStateRoot(blockHeight);

    assert.strictEqual(stateRoot, result, 'State root should match');

    SpyAssert.assert(spyMethod, 1, [[blockHeight]]);
  });

  it('should throw for undefined block height', async () => {
    let blockHeight = undefined;

    await AssertAsync.reject(
      anchor.getStateRoot(blockHeight),
      `Invalid block height: ${blockHeight}.`,
    );
  });
});
