'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Token.constructor()', () => {
  let web3;
  let address;
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
    address = '0x0000000000000000000000000000000000000002';
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      new EIP20Token(undefined, address);
    }, /Mandatory Parameter 'web3' is missing or invalid/);
  });

  it('should throw an error when token contract address is undefined', async () => {
    assert.throws(() => {
      new EIP20Token(web3, undefined);
    }, /Mandatory Parameter 'address' is missing or invalid./);
  });

  it('should throw an error when getEIP20Token returns undefined object', async () => {
    mockGetContract = sinon.mock(Contracts.getEIP20Token(web3, address));

    setup();

    mockedTokenObject = undefined;
    const errorMessage = `Could not load token contract for: ${address}`;

    assert.throws(() => {
      new EIP20Token(web3, address);
    }, errorMessage);

    SpyAssert.assert(spyContract, 1, [[web3, address]]);

    tearDown();
  });

  it('should pass when called with correct arguments', async () => {
    mockGetContract = sinon.mock(Contracts.getEIP20Token(web3, address));
    mockedTokenObject = mockGetContract.object;

    setup();

    const contractObject = new EIP20Token(web3, address);
    assert.strictEqual(
      contractObject.address,
      address,
      'Token contract address from contract must be equal to expected address',
    );
    assert.strictEqual(
      contractObject.contract,
      mockedTokenObject,
      'Contract address must be equal to expected address',
    );

    SpyAssert.assert(spyContract, 1, [[web3, address]]);

    tearDown();
  });
});
