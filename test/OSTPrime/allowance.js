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
const Utils = require('../../src/utils/Utils');

describe('OSTPrime.allowance()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
    ostPrime = new OSTPrime(web3, ostPrimeAddress);
  });

  it('should pass with correct params', async () => {
    let expectedAllowance = '100';
    const spyAllowance = sinon.replace(
      ostPrime.contract.methods,
      'allowance',
      sinon.fake.returns({
        call: () => Promise.resolve(expectedAllowance),
      }),
    );

    const spyMethod = sinon.spy(ostPrime, 'allowance');

    const ownerAddress = '0x0000000000000000000000000000000000000003';
    const spenderAddress = '0x0000000000000000000000000000000000000004';

    const result = await ostPrime.allowance(ownerAddress, spenderAddress);

    assert.strictEqual(
      result,
      expectedAllowance,
      'It must return expected allowance',
    );

    SpyAssert.assert(spyAllowance, 1, [[ownerAddress, spenderAddress]]);
    SpyAssert.assert(spyMethod, 1, [[ownerAddress, spenderAddress]]);

    sinon.restore();
  });

  it('should throw for invalid owner address', async () => {
    const ownerAddress = '0x123';
    const spenderAddress = '0x0000000000000000000000000000000000000004';

    await AssertAsync.reject(
      ostPrime.allowance(ownerAddress, spenderAddress),
      `Owner address is invalid or missing: ${ownerAddress}`,
    );
  });

  it('should throw for undefined owner address', async () => {
    const ownerAddress = undefined;
    const spenderAddress = '0x0000000000000000000000000000000000000004';

    await AssertAsync.reject(
      ostPrime.allowance(ownerAddress, spenderAddress),
      `Owner address is invalid or missing: ${ownerAddress}`,
    );
  });

  it('should throw for invalid spender address', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000004';
    const spenderAddress = '0x123';

    await AssertAsync.reject(
      ostPrime.allowance(ownerAddress, spenderAddress),
      `Spender address is invalid or missing: ${spenderAddress}`,
    );
  });

  it('should throw for undefined spender address', async () => {
    const ownerAddress = '0x0000000000000000000000000000000000000004';
    const spenderAddress = undefined;

    await AssertAsync.reject(
      ostPrime.allowance(ownerAddress, spenderAddress),
      `Spender address is invalid or missing: ${spenderAddress}`,
    );
  });
});
