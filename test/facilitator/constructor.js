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
const Facilitator = require('../../src/Facilitator/Facilitator');

const assert = chai.assert;

describe('Facilitator.constructor()', () => {
  let originWeb3, auxiliaryWeb3, gatewayAddress, coGatewayAddress;

  beforeEach(() => {
    originWeb3 = new Web3();
    auxiliaryWeb3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should throw an error when origin web3 object is undefined', async function() {
    this.timeout(5000);
    const expectedErrorMessage = 'Invalid origin web3 object.';
    try {
      new Facilitator(
        undefined,
        auxiliaryWeb3,
        gatewayAddress,
        coGatewayAddress,
      );
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should throw an error when auxiliary web3 object is undefined', async function() {
    this.timeout(5000);
    const expectedErrorMessage = 'Invalid auxiliary web3 object.';
    try {
      new Facilitator(originWeb3, undefined, gatewayAddress, coGatewayAddress);
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should throw an error when Gateway contract address is not valid', async function() {
    this.timeout(5000);
    const expectedErrorMessage = 'Invalid Gateway address.';
    try {
      new Facilitator(originWeb3, auxiliaryWeb3, undefined, coGatewayAddress);
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should throw an error when CoGateway contract address is not valid', async function() {
    this.timeout(5000);
    const expectedErrorMessage = 'Invalid Cogateway address.';
    try {
      new Facilitator(originWeb3, auxiliaryWeb3, gatewayAddress, undefined);
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

    const facilitator = new Facilitator(
      originWeb3,
      auxiliaryWeb3,
      gatewayAddress,
      coGatewayAddress,
    );

    assert.strictEqual(
      facilitator.originWeb3,
      originWeb3,
      'Origin web3 object is different than the expected object.',
    );

    assert.strictEqual(
      facilitator.auxiliaryWeb3,
      auxiliaryWeb3,
      'Auxiliary web3 object is different than the expected object.',
    );

    assert.strictEqual(
      facilitator.gatewayAddress,
      gatewayAddress,
      'Gateway contract address is different than the expected object.',
    );

    assert.strictEqual(
      facilitator.coGatewayAddress,
      coGatewayAddress,
      'CoGateway contract address is different than the expected object.',
    );
  });
});
