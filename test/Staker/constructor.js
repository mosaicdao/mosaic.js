'use strict';

const { assert } = require('chai');
const Staker = require('../../src/Staker');
const TestMosaic = require('../../test_utils/TestMosaic');

describe('Staker.constructor()', () => {
  let mosaic;

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
  });

  it('should throw an error when mosaic object is undefined', async () => {
    assert.throws(() => {
      new Staker();
    }, /Invalid mosaic object./);
  });

  it('should pass when called with correct arguments', async () => {
    const staker = new Staker(mosaic);
    assert.strictEqual(
      staker.web3,
      mosaic.origin.web3,
      'Web3 object is not set.',
    );
    assert.strictEqual(
      staker.gatewayAddress,
      mosaic.origin.contractAddresses.EIP20Gateway,
      'Gateway address is not set',
    );
  });
});
