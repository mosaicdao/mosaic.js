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

describe('EIP20CoGateway.getNonce()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let mockedNonce;
  let accountAddress;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'getNonce',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedNonce);
      }),
    );

    spyCall = sinon.spy(coGateway, 'getNonce');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);
    mockedNonce = '999';
    accountAddress = '0x0000000000000000000000000000000000000003';
  });

  it('should throw an error when account address is undefined', async () => {
    assert.throws(() => {
      coGateway.getNonce();
    }, /Invalid account address./);
  });

  it('should return correct mocked nonce', async () => {
    setup();
    const result = await coGateway.getNonce(accountAddress);
    assert.strictEqual(
      result,
      mockedNonce,
      'Function should return mocked message status.',
    );

    SpyAssert.assert(spyMethod, 1, [[accountAddress]]);
    SpyAssert.assert(spyCall, 1, [[accountAddress]]);
    tearDown();
  });
});
