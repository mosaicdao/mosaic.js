'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  OrganizationHelper = require('../../../libs/helpers/setup/OrganizationHelper'),
  AnchorHelper = require('../../../libs/helpers/setup/AnchorHelper'),
  assert = chai.assert;

const config = require('../../utils/configReader'),
  Web3WalletHelper = require('../../utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caOrganization && caAnchor = null below.
let caOrganization = null;
let caAnchor = null;
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
describe('tests/helpers/Anchor', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new AnchorHelper(web3, web3, caAnchor);

  let remoteChainId = '123456';
  let initialBlockHeight, initialStateRoot;

  before(function() {
    //This hook could take long time.
    this.timeout(3 * 60000);

    return web3WalletHelper
      .init(web3)
      .then(function(_out) {
        if (!caOrganization) {
          console.log('* Setting up Organization');
          let orgHelper = new OrganizationHelper(web3, caOrganization);
          const orgConfig = {
            deployer: config.deployerAddress,
            owner: config.deployerAddress
          };
          return orgHelper.setup(orgConfig).then(function() {
            caOrganization = orgHelper.address;
          });
        }
        return _out;
      })
      .then(function(_out) {
        if (!caAnchor) {
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

  if (!caAnchor) {
    it('should deploy new Anchor contract', function() {
      this.timeout(1 * 60000);
      return helper
        .deploy(remoteChainId, initialBlockHeight, initialStateRoot, 10, caOrganization, deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caAnchor = receipt.contractAddress;
        });
    });
  }

  //Set Co-Anchor Address.
  it('should set co-anchor address', function() {
    this.timeout(1 * 60000);
    return helper.setCoAnchorAddress(caAnchor, deployParams).then(validateReceipt);
  });

  //Test Setup
  it('should setup Anchor', function() {
    this.timeout(3 * 60000);
    let anchorConfig = {
      remoteChainId: 123456,
      deployer: config.deployerAddress,
      organization: caOrganization,
      coAnchorAddress: caAnchor,
      maxStateRoots: 10,
      organizationOwner: organizationOwner
    };
    return helper.setup(anchorConfig, deployParams);
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
