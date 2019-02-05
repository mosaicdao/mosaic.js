// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const chai = require('chai');
const StakeHelper = require('../../src/helpers/StakeHelper');
const TestMosaic = require('../../test_utils/GetTestMosaic');

const assert = chai.assert;

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
