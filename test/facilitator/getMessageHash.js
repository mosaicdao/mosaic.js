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

describe('facilitator.getMessageHash()', () => {
  let facilitator;
  let web3;
  let stakeRequestParams;
  let expectedMessageHash;
  beforeEach(() => {
    // runs before each test in this block
    const gatewayAddress = '0x8840EcA5EE92c1707d3A656FbbE75E66a02a3CB4';
    const coGatewayAddress = '0x0000000000000000000000000000000000000002';
    web3 = new Web3();
    facilitator = new Facilitator(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress,
    );
    expectedMessageHash =
      '0x66be1db4f3926e19d2c7ef05af1503548ba8fbae13708e1b70c60fb4b8c5ca38';
    stakeRequestParams = {
      amount: '100000000',
      beneficiary: '0x15113927E0EdF6b8430FA4B92FfFEB29B6F78D7C',
      nonce: '2',
      gasPrice: '1',
      gasLimit: '10000',
      sender: '0x751205Ac2dbD7C6a47d19E0FE9FD72eb2d270D14',
      hashLock:
        '0x1c1f2bccb60c653bd7046e27b4501373d9276c147350794ca62d01aa9321c8b0',
    };
  });

  it('should throw error when stake params are invalid', async () => {
    const expectedErrorMessage = 'Invalid stake request params.';
    try {
      await facilitator.getMessageHash();
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        expectedErrorMessage,
        `Exception reason must be "${expectedErrorMessage}"`,
      );
    }
  });

  it('should return correct message hash', async () => {
    const messageHash = await facilitator.getMessageHash(stakeRequestParams);
    assert.strictEqual(
      messageHash,
      expectedMessageHash,
      'Message hash must match.',
    );
  });
});
