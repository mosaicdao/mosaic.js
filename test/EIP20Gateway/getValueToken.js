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
const sinon = require('sinon');

const assert = chai.assert;
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Gateway.getValueToken()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let mockedValueTokenAddress;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'token',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedValueTokenAddress);
      }),
    );

    spyCall = sinon.spy(gateway, 'getValueToken');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    mockedValueTokenAddress = '0x0000000000000000000000000000000000000003';
  });

  it('should return correct mocked value token address', async () => {
    setup();
    const result = await gateway.getValueToken();
    assert.strictEqual(
      result,
      mockedValueTokenAddress,
      'Function should return mocked value token address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return correct value token address from instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getValueToken();
    assert.strictEqual(
      firstCallResult,
      mockedValueTokenAddress,
      'Function should return mocked value token address.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getValueToken();
    assert.strictEqual(
      secondCallResult,
      mockedValueTokenAddress,
      'Function should return mocked value token address.',
    );

    // Check if the method was not called this time.
    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
