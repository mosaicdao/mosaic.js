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
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('OSTPrime.constructor()', () => {
  let web3;
  let ostPrimeAddress;
  let ostPrime;
  let spyContract;

  beforeEach(() => {
    web3 = new Web3();
    ostPrimeAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should construct OSTPrime object', function() {
    let instance = sinon.fake();
    let ostPrimeSpy = (spyContract = sinon.replace(
      Contracts,
      'getOSTPrime',
      sinon.fake.returns(instance),
    ));

    ostPrime = new OSTPrime(web3, ostPrimeAddress);

    assert.strictEqual(
      ostPrime.contractAddress,
      ostPrimeAddress,
      'OST Prime contract address from contract must be equal to expected' +
        ' address.',
    );
    assert.strictEqual(
      ostPrime.contract,
      instance,
      'Contract instance must match.',
    );
    SpyAssert.assert(ostPrimeSpy, 1, [[web3, ostPrimeAddress]]);
    sinon.restore();
  });

  it('should throw if invalid web3 object is passed', function() {
    assert.throws(
      () => new OSTPrime('web3', ostPrimeAddress),
      /Mandatory Parameter 'web3' is missing or invalid/,
    );
  });

  it('should throw if web3 object is undefined', function() {
    assert.throws(
      () => new OSTPrime(undefined, ostPrimeAddress),
      /Mandatory Parameter 'web3' is missing or invalid/,
    );
  });

  it('should throw if invalid contract address is passed', function() {
    assert.throws(
      () => new OSTPrime(web3, '0x123'),
      /Mandatory Parameter 'contractAddress' is missing or invalid./,
    );
  });

  it('should throw if undefined contract address is passed', function() {
    assert.throws(
      () => new OSTPrime(web3, undefined),
      /Mandatory Parameter 'contractAddress' is missing or invalid./,
    );
  });

  it('should throw if contract interact is undefined', function() {
    sinon.replace(Contracts, 'getOSTPrime', sinon.fake.returns(undefined));

    assert.throws(
      () => new OSTPrime(web3, ostPrimeAddress),
      `Could not load OSTPrime contract for: ${ostPrimeAddress}`,
    );
    sinon.restore();
  });
});
