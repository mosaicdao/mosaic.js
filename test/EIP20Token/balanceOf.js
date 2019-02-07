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
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const assert = chai.assert;

describe('EIP20Token.balanceOf()', () => {
  let web3;
  let tokenAddress;
  let token;
  let accountAddress;
  let mockedBalance;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      token.contract.methods,
      'balanceOf',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedBalance);
      }),
    );
    spyCall = sinon.spy(token, 'balanceOf');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    tokenAddress = '0x0000000000000000000000000000000000000002';
    token = new EIP20Token(web3, tokenAddress);
    accountAddress = '0x0000000000000000000000000000000000000003';
    mockedBalance = '100';
  });

  it('should throw an error when account address is undefined', async () => {
    await AssertAsync.reject(
      token.balanceOf(undefined),
      `Invalid address: ${undefined}.`,
    );
  });

  it('should return mocked balance value', async () => {
    setup();
    const result = await token.balanceOf(accountAddress);

    assert.strictEqual(
      result,
      mockedBalance,
      'Result balance must be equal to mocked balance.',
    );
    SpyAssert.assert(spyMethod, 1, [[accountAddress]]);
    SpyAssert.assert(spyCall, 1, [[accountAddress]]);
    tearDown();
  });
});
