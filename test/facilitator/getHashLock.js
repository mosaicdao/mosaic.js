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
const Facilitator = require('../../libs/Facilitator/Facilitator');

const assert = chai.assert;

describe('facilitator.getHashLock()', () => {
  let facilitator, web3;
  beforeEach(() => {
    // runs before each test in this block
    const gatewayAddress = '0x52c50cC9bBa156C65756abd71b172B6408Dde006';
    const coGatewayAddress = '0xbF03E1680258c70B86D38A7e510F559A6440D06e';
    web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9546'));
    facilitator = new Facilitator(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress
    );
  });

  it('should return correct hash lock when secret is provided', async function() {
    this.timeout(5000);

    const secretString = 'secret';
    const unlockSecret = `0x${Buffer.from(secretString).toString('hex')}`;
    const expectedHashLock = web3.utils.sha3(secretString);

    const hashObj = facilitator.getHashLock(secretString);

    assert.strictEqual(
      hashObj.secret,
      secretString,
      'Secret is different than expected value.'
    );
    assert.strictEqual(
      hashObj.unlockSecret,
      unlockSecret,
      'Unlock secret is different than expected value.'
    );
    assert.strictEqual(
      hashObj.hashLock,
      expectedHashLock,
      'Hash lock is different than expected value.'
    );
  });

  it('should return hash lock and secret when called without any arguments', async function() {
    this.timeout(5000);

    const hashObj = facilitator.getHashLock();

    assert.isDefined(hashObj.secret, 'Secret must not be undefined.');
    assert.isDefined(
      hashObj.unlockSecret,
      'Unlock secret must not be undefined.'
    );
    assert.isDefined(hashObj.hashLock, 'Hash lock must not be undefined.');
  });
});
