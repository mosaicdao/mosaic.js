'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

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
