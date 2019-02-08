const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const Anchor = require('../../src/ContractInteract/Anchor');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('Anchor.constructor()', () => {
  let web3;
  let anchorAddress;
  let spyAnchor;

  beforeEach(() => {
    web3 = new Web3();
    anchorAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should pass when called with correct arguments', async () => {
    let mockObject = sinon.fake();

    spyAnchor = sinon.replace(
      Contracts,
      'getAnchor',
      sinon.fake.returns(mockObject),
    );

    const anchor = new Anchor(web3, anchorAddress);
    assert.strictEqual(
      anchor.anchorAddress,
      anchorAddress,
      'Anchor contract address from contract must be equal to expected address',
    );
    assert.strictEqual(
      anchor.contract,
      mockObject,
      'Contract instance must be equal to expected instance',
    );

    SpyAssert.assert(spyAnchor, 1, [[web3, anchorAddress]]);

    sinon.restore();
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      new Anchor(undefined, anchorAddress);
    }, /Mandatory Parameter 'web3' is missing or invalid/);
  });

  it('should throw an error when anchor contract address is undefined', async () => {
    assert.throws(() => {
      new Anchor(web3, undefined);
    }, /Mandatory Parameter 'anchorAddress' is missing or invalid./);
  });

  it('should throw error when contract instance is undefined', function() {
    spyAnchor = sinon.replace(
      Contracts,
      'getAnchor',
      sinon.fake.returns(undefined),
    );

    assert.throws(() => {
      new Anchor(web3, anchorAddress);
    }, `Could not load anchor contract for: ${anchorAddress}`);

    sinon.restore();
  });
});
