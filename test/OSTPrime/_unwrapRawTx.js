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

describe('OSTPrime._unwrapRawTx()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
    ostPrime = new OSTPrime(web3, ostPrimeAddress);
  });

  it('should pass with correct params', async () => {
    let mockTx = 'tx';
    const spyUnwrap = sinon.replace(
      ostPrime.contract.methods,
      'unwrap',
      sinon.fake.resolves(Promise.resolve(mockTx)),
    );

    const spyMethod = sinon.spy(ostPrime, '_unwrapRawTx');
    const amount = '100';

    const result = await ostPrime._unwrapRawTx(amount);

    assert.strictEqual(result, mockTx, 'It must return expected tx');

    SpyAssert.assert(spyUnwrap, 1, [[amount]]);
    SpyAssert.assert(spyMethod, 1, [[amount]]);

    sinon.restore();
  });

  it('should throw an error when amount is undefined', async () => {
    const amount = undefined;

    await AssertAsync.reject(
      ostPrime._unwrapRawTx(amount),
      `Invalid amount: ${amount}.`,
    );
  });
});
