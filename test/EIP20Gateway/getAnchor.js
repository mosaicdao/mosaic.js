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
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('EIP20Gateway.getAnchor()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let getStateRootProviderAddressResult;

  let spyCall;
  let spyGetStateRootProviderAddress;

  const setup = () => {
    spyGetStateRootProviderAddress = sinon.replace(
      gateway,
      'getStateRootProviderAddress',
      sinon.fake.resolves(getStateRootProviderAddressResult),
    );
    spyCall = sinon.spy(gateway, 'getAnchor');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    getStateRootProviderAddressResult =
      '0x0000000000000000000000000000000000000003';
  });

  it('should return anchor object', async () => {
    setup();
    const result = await gateway.getAnchor();
    assert.strictEqual(
      result.web3,
      web3,
      'Function should return anchor object with correct web3.',
    );
    assert.strictEqual(
      result.anchorAddress,
      getStateRootProviderAddressResult,
      'Function should return anchor object with correct anchor address.',
    );

    SpyAssert.assert(spyGetStateRootProviderAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);
    tearDown();
  });

  it('should return anchor object from the instance variable', async () => {
    setup();
    const firstCallResult = await gateway.getAnchor();
    assert.strictEqual(
      firstCallResult.web3,
      web3,
      'Function should return anchor object with correct web3.',
    );
    assert.strictEqual(
      firstCallResult.anchorAddress,
      getStateRootProviderAddressResult,
      'Function should return anchor object with correct anchor address.',
    );

    SpyAssert.assert(spyGetStateRootProviderAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 1, [[]]);

    const secondCallResult = await gateway.getAnchor();
    assert.strictEqual(
      secondCallResult.web3,
      web3,
      'Function should return anchor object with correct web3.',
    );
    assert.strictEqual(
      secondCallResult.anchorAddress,
      getStateRootProviderAddressResult,
      'Function should return anchor object with correct anchor address.',
    );

    SpyAssert.assert(spyGetStateRootProviderAddress, 1, [[]]);
    SpyAssert.assert(spyCall, 2, [[], []]);
    tearDown();
  });
});
