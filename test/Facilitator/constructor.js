'use strict';

const { assert } = require('chai');
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/TestMosaic');

describe('Facilitator.constructor()', () => {
  let mosaic;
  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
  });

  it('should throw an error when mosaic object is undefined', async () => {
    const expectedErrorMessage = 'Invalid mosaic object.';
    try {
      new Facilitator();
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should pass with valid arguments', async () => {
    const facilitator = new Facilitator(mosaic);

    assert.strictEqual(
      facilitator.mosaic,
      mosaic,
      'Mosaic object must be same.',
    );
  });
});
