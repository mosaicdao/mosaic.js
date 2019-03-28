'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const Anchor = require('../../src/ContractInteract/Anchor');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('Anchor.getLatestStateRootBlockHeight', () => {
  let web3;
  let address;
  let anchor;

  beforeEach(() => {
    web3 = new Web3();
    address = '0x0000000000000000000000000000000000000002';
    anchor = new Anchor(web3, address);
  });

  it('should pass when called with correct arguments', async () => {
    let blockHeight = '10';

    let spyMethod = sinon.replace(
      anchor.contract.methods,
      'getLatestStateRootBlockHeight',
      sinon.fake.returns({
        call: () => Promise.resolve(blockHeight),
      }),
    );

    let result = await anchor.getLatestStateRootBlockHeight();

    assert.strictEqual(blockHeight, result, 'Block height should match');

    SpyAssert.assert(spyMethod, 1, [[]]);
  });
});
