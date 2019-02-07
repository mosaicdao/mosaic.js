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
const OSTPrime = require('../../src/ContractInteract/OSTPrime');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('OSTPrime.balanceOf()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
    ostPrime = new OSTPrime(web3, ostPrimeAddress);
  });

  it('should pass with correct params', async () => {
    let balance = '100';

    const spyBalanceOf = sinon.replace(
      ostPrime.contract.methods,
      'balanceOf',
      sinon.fake.returns({
        call: () => Promise.resolve(balance),
      }),
    );

    const spyMethod = sinon.spy(ostPrime, 'balanceOf');

    const accountAddress = '0x0000000000000000000000000000000000000003';

    const result = await ostPrime.balanceOf(accountAddress);

    assert.strictEqual(result, balance, 'It must return expected balance');

    SpyAssert.assert(spyBalanceOf, 1, [[accountAddress]]);
    SpyAssert.assert(spyMethod, 1, [[accountAddress]]);

    sinon.restore();
  });

  it('should throw for invalid account address', async () => {
    const accountAddress = '0x123';

    await AssertAsync.reject(
      ostPrime.balanceOf(accountAddress),
      `Invalid address: ${accountAddress}.`,
    );
  });

  it('should throw for undefined account address', async () => {
    const accountAddress = undefined;

    await AssertAsync.reject(
      ostPrime.balanceOf(accountAddress),
      `Invalid address: ${accountAddress}.`,
    );
  });
});
