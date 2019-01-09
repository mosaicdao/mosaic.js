'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  OrganizationHelper = require('../../../libs/helpers/setup/OrganizationHelper'),
  assert = chai.assert;

const config = require('../../utils/configReader'),
  Web3WalletHelper = require('../../utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Organisation Contract Address. TBD: Do not forget to set caOrganisation = null below.
let caOrganisation = null;

let validateReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

let validateDeploymentReceipt = (receipt) => {
  validateReceipt(receipt);
  let contractAddress = receipt.contractAddress;
  assert.isNotEmpty(contractAddress, 'Deployment Receipt is missing contractAddress');
  assert.isTrue(web3.utils.isAddress(contractAddress), 'Invalid contractAddress in Receipt');
  return receipt;
};
describe('tests/helpers/OrganizationHelper', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  const orgConfig = {
    deployer: config.deployerAddress,
    owner: config.deployerAddress,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker],
    workerExpirationHeight: '2000000'
  };

  let helper = new OrganizationHelper(web3, caOrganisation);

  before(function() {
    this.timeout(60 * 1000);
    return web3WalletHelper.init(web3);
  });

  if (!caOrganisation) {
    it('should deploy new organization contract', function() {
      this.timeout(3 * 60 * 1000);
      return helper
        .deploy(orgConfig.owner, null, null, null, deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caOrganisation = receipt.contractAddress;
        });
    });
  }

  //Admin Key Address
  let kaAdmin = orgConfig.admin;
  it('should set admin address', function() {
    this.timeout(3 * 60 * 1000);
    return helper.setAdmin(kaAdmin, deployParams).then(validateReceipt);
  });

  //Worker Key Address
  let kaWorker = config.deployerAddress;
  it('should set worker address', function() {
    this.timeout(3 * 60 * 1000);
    return helper.setWorker(kaWorker, '10000000', deployParams).then(validateReceipt);
  });

  //Owner Key Address
  let kaOwner = config.organizationOwner;
  it('should initiate Ownership Transfer', function() {
    this.timeout(3 * 60 * 1000);
    return helper.initiateOwnershipTransfer(kaOwner, deployParams).then(validateReceipt);
  });

  it('should complete Ownership Transfer', function() {
    this.timeout(2 * 60 * 1000);
    let ownerParams = Object.assign({}, deployParams, {
      from: kaOwner
    });
    return helper.completeOwnershipTransfer(ownerParams).then(validateReceipt);
  });

  it('should do complete organization setup', function() {
    orgConfig.owner = config.organizationOwner;
    this.timeout(2 * 60 * 1000);
    return helper.setup(orgConfig);
  });
});

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
