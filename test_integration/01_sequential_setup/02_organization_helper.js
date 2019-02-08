'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const { ChainSetup } = require('../../index');
const Organization = require('../../src/ContractInteract/Organization');

const { OrganizationHelper } = ChainSetup;

const shared = require('../shared');

const assertReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

const assertDeploymentReceipt = (receipt) => {
  assertReceipt(receipt);
  const contractAddress = receipt.contractAddress;
  assert.isNotEmpty(
    contractAddress,
    'Deployment Receipt is missing contractAddress',
  );
  assert.isTrue(
    Web3.utils.isAddress(contractAddress),
    'Invalid contractAddress in Receipt',
  );
  return receipt;
};

describe('OrganizationHelper', () => {
  let deployParams;
  let orgConfig;

  beforeEach(() => {
    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };

    orgConfig = {
      deployer: shared.setupConfig.deployerAddress,
      owner: shared.setupConfig.deployerAddress,
      admin: shared.setupConfig.organizationAdmin,
      workers: [shared.setupConfig.organizationWorker],
      workerExpirationHeight: '2000000',
    };
  });

  after(() => {
    return Organization.setup(shared.auxiliary.web3, orgConfig).then(
      (instance) => {
        shared.auxiliary.addresses.Organization = instance.address;
      },
    );
  });

  const subject = new OrganizationHelper(shared.origin.web3);

  it('should deploy new organization contract', () => {
    return subject
      .deploy(orgConfig.owner, undefined, undefined, undefined, deployParams)
      .then(assertDeploymentReceipt);
  });

  it('should do complete organization setup', () => {
    const _orgConfig = orgConfig;
    _orgConfig.owner = shared.setupConfig.organizationOwner;

    return Organization.setup(shared.origin.web3, _orgConfig).then(
      (instance) => {
        shared.origin.addresses.Organization = instance.address;
      },
    );
  });
});
