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

describe('OSTPrime.unwrap()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
    ostPrime = new OSTPrime(web3, ostPrimeAddress);
  });

  it('should pass with correct params', async () => {
    const mockTX = 'mockTX';

    const spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
    const unwrapRawTxSpy = sinon.replace(
      ostPrime,
      '_unwrapRawTx',
      sinon.fake.resolves(mockTX),
    );
    const amount = '100';
    const txOptions = { from: '0x0000000000000000000000000000000000000004' };

    const result = await ostPrime.unwrap(amount, txOptions);

    assert.isTrue(result, 'Unwrap should return true');

    SpyAssert.assert(unwrapRawTxSpy, 1, [[amount]]);

    SpyAssert.assert(spySendTransaction, 1, [[mockTX, txOptions]]);
  });

  it('should throw for invalid from address in tx options', async () => {
    const amount = '100';
    const txOptions = { from: '0x1234' };

    await AssertAsync.reject(
      ostPrime.unwrap(amount, txOptions),
      `Invalid from address: ${txOptions.from}.`,
    );
  });

  it('should throw for undefined address in tx options', async () => {
    const amount = '100';
    const txOptions = { from: undefined };

    await AssertAsync.reject(
      ostPrime.unwrap(amount, txOptions),
      `Invalid from address: ${txOptions.from}.`,
    );
  });

  it('should throw for undefined tx options', async () => {
    const amount = '100';
    const txOptions = undefined;

    await AssertAsync.reject(
      ostPrime.unwrap(amount, txOptions),
      `Invalid transaction options: ${txOptions}.`,
    );
  });

  it('should throw for undefined amount', async () => {
    const amount = undefined;
    const txOptions = { from: '0x0000000000000000000000000000000000000004' };

    await AssertAsync.reject(
      ostPrime.unwrap(amount, txOptions),
      `Invalid unwrap amount: ${amount}.`,
    );
  });
});
