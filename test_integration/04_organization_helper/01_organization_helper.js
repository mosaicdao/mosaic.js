'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const OrganizationHelper = require('../../libs/helpers/setup/OrganizationHelper');

const shared = require('../shared');

const assertReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

const assertDeploymentReceipt = (receipt) => {
  assertReceipt(receipt);
  let contractAddress = receipt.contractAddress;
  assert.isNotEmpty(contractAddress, 'Deployment Receipt is missing contractAddress');
  assert.isTrue(Web3.utils.isAddress(contractAddress), 'Invalid contractAddress in Receipt');
  return receipt;
};

describe('OrganizationHelper', () => {
  let addressOrganisation;

  let deployParams;
  let orgConfig;

  beforeEach(() => {
    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice
    };

    orgConfig = {
      deployer: shared.setupConfig.deployerAddress,
      owner: shared.setupConfig.deployerAddress,
      admin: shared.setupConfig.organizationAdmin,
      workers: [shared.setupConfig.organizationWorker],
      workerExpirationHeight: '2000000'
    };
  });

  let helper = new OrganizationHelper(shared.origin.web3, addressOrganisation);

  it('should deploy new organization contract', () => {
    return helper
      .deploy(orgConfig.owner, null, null, null, deployParams)
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        addressOrganisation = receipt.contractAddress;
      });
  });

  it('should set admin address', () => {
    //Admin Key Address
    let kaAdmin = orgConfig.admin;
    return helper.setAdmin(kaAdmin, deployParams).then(assertReceipt);
  });

  it('should set worker address', () => {
    // Worker Key Address
    let kaWorker = orgConfig.workers[0];
    return helper.setWorker(kaWorker, '10000000', deployParams).then(assertReceipt);
  });

  it('should initiate Ownership Transfer', () => {
    // Owner Key Address
    let kaOwner = orgConfig.admin;
    return helper.initiateOwnershipTransfer(kaOwner, deployParams).then(assertReceipt);
  });

  it('should complete Ownership Transfer', () => {
    // Owner Key Address
    let kaOwner = orgConfig.admin;
    let ownerParams = Object.assign({}, deployParams, {
      from: kaOwner
    });
    return helper.completeOwnershipTransfer(ownerParams).then(assertReceipt);
  });

  it('should do complete organization setup', () => {
    const _orgConfig = orgConfig;
    _orgConfig.owner = shared.setupConfig.organizationOwner;
    return helper.setup(_orgConfig);
  });
});
