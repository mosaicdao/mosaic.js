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
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20CoGateway.getBounty()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let mockedBountyAmount;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'bounty',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedBountyAmount);
      }),
    );

    spyCall = sinon.spy(coGateway, 'getBounty');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);
    mockedBountyAmount = '10000';
  });

  it('should return correct mocked bounty amount', async () => {
    setup();
    const result = await coGateway.getBounty();
    assert.strictEqual(
      result,
      mockedBountyAmount,
      'Function should return mocked bounty amount.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return correct bounty amount from instance variable', async () => {
    setup();
    const firstCallResult = await coGateway.getBounty();
    assert.strictEqual(
      firstCallResult,
      mockedBountyAmount,
      'Function should return mocked bounty amount.',
    );

    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await coGateway.getBounty();
    assert.strictEqual(
      secondCallResult,
      mockedBountyAmount,
      'Function should return mocked bounty amount.',
    );

    // Check if the method was not called this time.
    SpyAssert.assert(spyMethod, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
