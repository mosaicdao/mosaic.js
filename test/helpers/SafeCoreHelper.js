'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  OrganizationHelper = require('../../libs/helpers/OrganizationHelper'),
  SafeCoreHelper = require('../../libs/helpers/SafeCoreHelper'),
  assert = chai.assert;

const config = require('../../test/utils/configReader'),
  Web3WalletHelper = require('../../test/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caOrganization && caSafeCore = null below.
let caOrganization = null;
let caSafeCore = null;
let organizationOwner = config.deployerAddress;

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
describe('test/helpers/SafeCore', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new SafeCoreHelper(web3, caSafeCore);

  let coreChainId = '123456';
  let initialBlockHeight, initialStateRoot;

  before(function() {
    //This hook could take long time.
    this.timeout(120000);

    return web3WalletHelper
      .init(web3)
      .then(function(_out) {
        if (!caOrganization) {
          console.log('* Setting up Organization');
          let orgHelper = new OrganizationHelper(web3, caOrganization);
          const orgConfig = {
            deployer: config.deployerAddress,
            worker: config.organizationWorker
          };
          return orgHelper.setup(orgConfig).then(function() {
            caOrganization = orgHelper.address;
          });
        }
        return _out;
      })
      .then(function(_out) {
        if (!caSafeCore) {
          console.log('Getting latest block');
          //Get BlockHeight and StateRoot
          return web3.eth.getBlock('latest').then(function(block) {
            console.log('block', block);
            initialBlockHeight = block.number;
            initialStateRoot = block.stateRoot;
          });
        }
        return _out;
      });
  });

  if (!caSafeCore) {
    it('should deploy new SafeCore contract', function() {
      console.log('caOrganization', caOrganization);
      return helper
        .deploy(coreChainId, initialBlockHeight, initialStateRoot, caOrganization, deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caSafeCore = receipt.contractAddress;
        });
    });
  }

  //Set Co-Core Address.
  let caCoCore = caSafeCore;
  it('should set co-core address', function() {
    return helper.setCoCoreAddress(caSafeCore, deployParams).then(validateReceipt);
  });

  //Test Setup
  it('should setup SafeCore', function() {
    this.timeout(60000);
    let safeCoreConfig = {
      remoteChainId: 123456,
      deployer: config.deployerAddress,
      organization: caOrganization,
      coCoreAddress: caSafeCore,
      organizationOwner: organizationOwner
    };
    return helper.setup(safeCoreConfig, deployParams);
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
