'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../index'),
  ChainSetup = Package.ChainSetup,
  assert = chai.assert;

const config = require('../tests/utils/configReader'),
  Web3WalletHelper = require('../tests/utils/Web3WalletHelper'),
  MockContractsDeployer = require('../tests/utils/MockContractsDeployer');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caMockToken = null below.
let caMockToken = null;

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
    this.timeout(5 * 60000);
    //This hook could take long time.
    return web3WalletHelper.init(web3).then(function() {
      let deployer = new MockContractsDeployer(config.deployerAddress, web3);
      return deployer.deployMockToken().then(function() {
        caMockToken = deployer.addresses.MockToken;
      });
    });
  });

  let helper = new ChainSetup(web3, web3);
  let chainSetupOutput;
  it('should do mosaic setup with exhaustive configurations', function() {
    this.timeout(1 * 60 * 60 * 1000); //1 hr.
    let valueToken = caMockToken;
    return helper.setup(valueToken, originConfig, auxiliaryConfig).then(function(output) {
      chainSetupOutput = output;
      console.log('chainSetupOutput', JSON.stringify(chainSetupOutput));
      return chainSetupOutput;
    });
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
