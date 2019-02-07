'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const OrganizationHelper = require('../../src/helpers/setup/OrganizationHelper');

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
    const auxiliaryHelper = new OrganizationHelper(shared.auxiliary.web3);
    return auxiliaryHelper.setup(orgConfig).then(() => {
      shared.auxiliary.addresses.Organization = auxiliaryHelper.address;
    });
  });

  const subject = new OrganizationHelper(shared.origin.web3);

  it('should deploy new organization contract', () => {
    return subject
      .deploy(orgConfig.owner, null, null, null, deployParams)
      .then(assertDeploymentReceipt);
  });

  it('should set admin address', () => {
    const adminKeyAddress = orgConfig.admin;
    return subject.setAdmin(adminKeyAddress, deployParams).then(assertReceipt);
  });

  it('should set worker address', () => {
    const workerKeyAddress = orgConfig.workers[0];
    return subject
      .setWorker(workerKeyAddress, '10000000', deployParams)
      .then(assertReceipt);
  });

  it('should initiate Ownership Transfer', () => {
    const ownerKeyAddress = orgConfig.admin;
    return subject
      .initiateOwnershipTransfer(ownerKeyAddress, deployParams)
      .then(assertReceipt);
  });

  it('should complete Ownership Transfer', () => {
    const ownerKeyAddress = orgConfig.admin;
    const ownerParams = Object.assign({}, deployParams, {
      from: ownerKeyAddress,
    });
    return subject.completeOwnershipTransfer(ownerParams).then(assertReceipt);
  });

  it('should do complete organization setup', () => {
    const _orgConfig = orgConfig;
    _orgConfig.owner = shared.setupConfig.organizationOwner;
    return subject.setup(_orgConfig).then(() => {
      shared.origin.addresses.Organization = subject.address;
    });
  });
});
