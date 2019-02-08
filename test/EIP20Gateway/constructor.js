'use strict';

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

const { assert } = chai;

describe('EIP20Gateway.constructor()', () => {
  let web3;
  let gatewayAddress;
  let mockGetContract;
  let mockedGatewayObject;
  let spyContract;

  const setup = () => {
    spyContract = sinon.replace(
      Contracts,
      'getEIP20Gateway',
      sinon.fake.returns(mockedGatewayObject),
    );
  };

  const tearDown = () => {
    mockGetContract.restore();
    sinon.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      new EIP20Gateway(undefined, gatewayAddress);
    }, /Mandatory Parameter 'web3' is missing or invalid/);
  });

  it('should throw an error when gateway contract address is undefined', async () => {
    assert.throws(() => {
      new EIP20Gateway(web3, undefined);
    }, /Mandatory Parameter 'gatewayAddress' is missing or invalid./);
  });

  it('should throw an error when getEIP20Gateway returns undefined object', async () => {
    mockGetContract = sinon.mock(
      Contracts.getEIP20Gateway(web3, gatewayAddress),
    );

    setup();

    mockedGatewayObject = undefined;
    const errorMessage = `Could not load EIP20Gateway contract for: ${gatewayAddress}`;

    assert.throws(() => {
      new EIP20Gateway(web3, gatewayAddress);
    }, errorMessage);

    SpyAssert.assert(spyContract, 1, [[web3, gatewayAddress]]);

    tearDown();
  });

  it('should pass when called with correct arguments', async () => {
    mockGetContract = sinon.mock(
      Contracts.getEIP20Gateway(web3, gatewayAddress),
    );
    mockedGatewayObject = mockGetContract.object;

    setup();

    const contractObject = new EIP20Gateway(web3, gatewayAddress);
    assert.strictEqual(
      contractObject.gatewayAddress,
      gatewayAddress,
      'Gateway contract address from contract must be equal to expected address',
    );
    assert.strictEqual(
      contractObject.contract,
      mockedGatewayObject,
      'Contract address must be equal to expected address',
    );

    SpyAssert.assert(spyContract, 1, [[web3, gatewayAddress]]);

    tearDown();
  });
});
