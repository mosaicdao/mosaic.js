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
const Utils = require('../../src/utils/Utils');

const messageStatus = Utils.messageStatus();
const assert = chai.assert;

describe('facilitator.canPerformConfrimStakeIntent()', () => {
  let facilitator;
  let web3;

  beforeEach(() => {
    // runs before each test in this block
    const gatewayAddress = '0x0000000000000000000000000000000000000001';
    const coGatewayAddress = '0x0000000000000000000000000000000000000002';
    web3 = new Web3();
    facilitator = new Facilitator(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress,
    );
  });

  it('should return false when message status is undeclared', async () => {
    const result = facilitator.canPerformConfrimStakeIntent(
      messageStatus.UNDECLARED,
    );
    assert.strictEqual(result, false, 'Expected result is false');
  });

  it('should return false when message status is revoked', async () => {
    const result = facilitator.canPerformConfrimStakeIntent(
      messageStatus.REVOKED,
    );
    assert.strictEqual(result, false, 'Expected result is false');
  });

  it('should return true when message status is declared', async () => {
    const result = facilitator.canPerformConfrimStakeIntent(
      messageStatus.DECLARED,
    );
    assert.strictEqual(result, true, 'Expected result is true');
  });

  it('should return true when message status is progressed', async () => {
    const result = facilitator.canPerformConfrimStakeIntent(
      messageStatus.PROGRESSED,
    );
    assert.strictEqual(result, true, 'Expected result is true');
  });

  it('should return true when message status is revocation declared', async () => {
    const result = facilitator.canPerformConfrimStakeIntent(
      messageStatus.REVOCATION_DECLARED,
    );
    assert.strictEqual(result, true, 'Expected result is true');
  });
});
