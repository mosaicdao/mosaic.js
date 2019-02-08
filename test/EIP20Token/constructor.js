'use strict';

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Token.constructor()', () => {
  let web3;
  let tokenAddress;
  let mockGetContract;
  let mockedTokenObject;
  let spyContract;

  const setup = () => {
    spyContract = sinon.replace(
      Contracts,
      'getEIP20Token',
      sinon.fake.returns(mockedTokenObject),
    );
  };

  const tearDown = () => {
    mockGetContract.restore();
    sinon.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    tokenAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      new EIP20Token(undefined, tokenAddress);
    }, /Mandatory Parameter 'web3' is missing or invalid/);
  });

  it('should throw an error when token contract address is undefined', async () => {
    assert.throws(() => {
      new EIP20Token(web3, undefined);
    }, /Mandatory Parameter 'tokenAddress' is missing or invalid./);
  });

  it('should throw an error when getEIP20Token returns undefined object', async () => {
    mockGetContract = sinon.mock(Contracts.getEIP20Token(web3, tokenAddress));

    setup();

    mockedTokenObject = undefined;
    const errorMessage = `Could not load token contract for: ${tokenAddress}`;

    assert.throws(() => {
      new EIP20Token(web3, tokenAddress);
    }, errorMessage);

    SpyAssert.assert(spyContract, 1, [[web3, tokenAddress]]);

    tearDown();
  });

  it('should pass when called with correct arguments', async () => {
    mockGetContract = sinon.mock(Contracts.getEIP20Token(web3, tokenAddress));
    mockedTokenObject = mockGetContract.object;

    setup();

    const contractObject = new EIP20Token(web3, tokenAddress);
    assert.strictEqual(
      contractObject.tokenAddress,
      tokenAddress,
      'Token contract address from contract must be equal to expected address',
    );
    assert.strictEqual(
      contractObject.contract,
      mockedTokenObject,
      'Contract address must be equal to expected address',
    );

    SpyAssert.assert(spyContract, 1, [[web3, tokenAddress]]);

    tearDown();
  });
});
