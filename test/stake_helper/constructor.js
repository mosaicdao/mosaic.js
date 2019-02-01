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
const Web3 = require('web3');
const StakeHelper = require('../../libs/helpers/StakeHelper');

const assert = chai.assert;

describe('StakeHelper.constructor()', () => {
  let originWeb3;
  let gatewayAddress;

  beforeEach(() => {
    originWeb3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000001';
  });

  it('should throw an error when origin web3 object is undefined', async function() {
    const expectedErrorMessage = 'Invalid origin web3 object.';
    try {
      new StakeHelper(undefined, gatewayAddress);
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should throw an error when Gateway contract address is not valid', async function() {
    const expectedErrorMessage = 'Invalid Gateway address.';
    try {
      new StakeHelper(originWeb3, '0x123');
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should pass with valid constructor arguments', async function() {
    this.timeout(5000);

    const stakeHelper = new StakeHelper(originWeb3, gatewayAddress);

    assert.strictEqual(
      stakeHelper.web3,
      originWeb3,
      'Origin web3 object is different than the expected object.',
    );

    assert.strictEqual(
      stakeHelper.gatewayAddress,
      gatewayAddress,
      'Gateway contract address is different than the expected object.',
    );
  });
});
