const chai = require('chai');
const StakeHelper = require('../../src/helpers/StakeHelper');
const TestMosaic = require('../../test_utils/TestMosaic');

const { assert } = chai;

describe('StakeHelper.constructor()', () => {
  let mosaic;
  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
  });

  it('should throw an error when mosaic object is undefined', async function() {
    const expectedErrorMessage = 'Invalid mosaic object.';
    try {
      new StakeHelper();
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should pass with valid constructor arguments', async function() {
    const stakeHelper = new StakeHelper(mosaic);

    assert.strictEqual(
      stakeHelper.mosaic,
      mosaic,
      'Mosaic object must be same.',
    );

    assert.strictEqual(
      stakeHelper.originWeb3,
      mosaic.origin.web3,
      'Origin web3 object is different than the expected object.',
    );

    assert.strictEqual(
      stakeHelper.gatewayAddress,
      mosaic.origin.contractAddresses.EIP20Gateway,
      'Gateway contract address is different than the expected object.',
    );
  });
});
