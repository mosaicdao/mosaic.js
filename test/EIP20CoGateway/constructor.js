const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const { assert } = chai;
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20CoGateway.constructor()', () => {
  let web3;
  let coGatewayAddress;
  let mockGetContract;
  let mockedCoGatewayObject;
  let spyContract;

  const setup = () => {
    spyContract = sinon.replace(
      Contracts,
      'getEIP20CoGateway',
      sinon.fake.returns(mockedCoGatewayObject),
    );
  };

  const tearDown = () => {
    mockGetContract.restore();
    sinon.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
  });

  it('should throw an error when web3 object is undefined', async () => {
    assert.throws(() => {
      new EIP20CoGateway(undefined, coGatewayAddress);
    }, /Mandatory Parameter 'web3' is missing or invalid/);
  });

  it('should throw an error when cogateway contract address is undefined', async () => {
    assert.throws(() => {
      new EIP20CoGateway(web3, undefined);
    }, /Mandatory Parameter 'coGatewayAddress' is missing or invalid./);
  });

  it('should throw an error when getEIP20CoGateway returns undefined object', async () => {
    mockGetContract = sinon.mock(
      Contracts.getEIP20CoGateway(web3, coGatewayAddress),
    );

    setup();

    mockedCoGatewayObject = undefined;
    const errorMessage = `Could not load EIP20CoGateway contract for: ${coGatewayAddress}`;

    assert.throws(() => {
      new EIP20CoGateway(web3, coGatewayAddress);
    }, errorMessage);

    SpyAssert.assert(spyContract, 1, [[web3, coGatewayAddress]]);

    tearDown();
  });

  it('should pass when called with correct arguments', async () => {
    mockGetContract = sinon.mock(
      Contracts.getEIP20CoGateway(web3, coGatewayAddress),
    );
    mockedCoGatewayObject = mockGetContract.object;

    setup();

    const contractObject = new EIP20CoGateway(web3, coGatewayAddress);
    assert.strictEqual(
      contractObject.coGatewayAddress,
      coGatewayAddress,
      'Cogateway contract address from contract must be equal to expected address',
    );
    assert.strictEqual(
      contractObject.contract,
      mockedCoGatewayObject,
      'Contract address must be equal to expected address',
    );

    SpyAssert.assert(spyContract, 1, [[web3, coGatewayAddress]]);

    tearDown();
  });
});
