'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  ChainSetup = require('../libs/ChainSetup'),
  assert = chai.assert;

const config = require('../tests/utils/configReader'),
  Web3WalletHelper = require('../tests/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

let originConfig = {
  gasPrice: '0x5B9ACA00',
  tokenOrganization: {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker]
  },
  anchorOrganization: {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker]
  },
  libs: {
    deployer: config.deployerAddress
  },
  anchor: {
    remoteChainId: '12345',
    deployer: config.deployerAddress,
    organizationOwner: config.organizationOwner
  },

  gateway: {
    deployer: config.deployerAddress,
    bounty: '100'
  }
};

let auxiliaryConfig = {
  gasPrice: '0',
  tokenOrganization: {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker]
  },
  ostPrime: {
    deployer: config.deployerAddress,
    chainOwner: config.chainOwner
  },
  anchorOrganization: {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker]
  },
  anchor: {
    remoteChainId: '12345',
    deployer: config.deployerAddress,
    organizationOwner: config.organizationOwner
  },
  libs: {
    deployer: config.deployerAddress
  },
  cogateway: {
    deployer: config.deployerAddress,
    bounty: '100'
  }
};

//To-Do: Write Test Case here.
describe('tests/ChainSetup', function() {
  before(function() {
    this.timeout(3 * 60000);
    //This hook could take long time.
    return web3WalletHelper.init(web3);
  });

  const someValidAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';
  let helper = new ChainSetup(web3, web3);
  it('should do mosaic setup with exhaustive configurations', function() {
    this.timeout(1 * 60 * 60 * 1000); //1 hr.
    let valueToken = someValidAddress;
    return helper.setup(valueToken, originConfig, auxiliaryConfig);
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
