const { assert } = require('chai');
const StakeHelper = require('../../src/helpers/StakeHelper');
const TestMosaic = require('../../test_utils/TestMosaic');

describe('StakeHelper.constructor()', () => {
  let mosaic;
  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
  });

  it('should throw an error when a web3 object is undefined', async function() {
    let expectedErrorMessage = 'invalid origin web3 object';
    try {
      new StakeHelper();
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }

    expectedErrorMessage = 'invalid auxiliary web3 object';
    try {
      new StakeHelper(mosaic.origin.web3);
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should pass with valid constructor arguments', async function() {
    const stakeHelper = new StakeHelper(
      mosaic.origin.web3,
      mosaic.auxiliary.web3,
      mosaic.origin.contractAddresses.EIP20Gateway,
      mosaic.auxiliary.contractAddresses.EIP20CoGateway,
    );

    assert.strictEqual(
      stakeHelper.originWeb3,
      mosaic.origin.web3,
      'Mosaic object must be same.',
    );

    assert.strictEqual(
      stakeHelper.auxiliaryWeb3,
      mosaic.auxiliary.web3,
      'Origin web3 object is different than the expected object.',
    );

    assert.strictEqual(
      stakeHelper.gatewayAddress,
      mosaic.origin.contractAddresses.EIP20Gateway,
      'Gateway contract address is different than the expected object.',
    );

    assert.strictEqual(
      stakeHelper.coGatewayAddress,
      mosaic.auxiliary.contractAddresses.EIP20CoGateway,
      'CoGateway contract address is different than the expected object.',
    );
  });
});
