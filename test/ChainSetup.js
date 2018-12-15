'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  ChainSetup = require('../libs/ChainSetup'),
  assert = chai.assert;

const config = require('../test/utils/configReader'),
  Web3WalletHelper = require('../test/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

let getCompleteOriginConfig = function() {
  return {
    deployer: config.deployerAddress,
    gasPrice: '0x5B9ACA00',
    libs: {
      deployer: config.deployerAddress
    },
    organization: {
      deployer: config.deployerAddress,
      owner: config.organizationOwner,
      admin: config.organizationAdmin,
      worker: config.organizationWorker,
      completeOwnershipTransfer: true
    },
    safeCore: {
      remoteChainId: '12345',
      deployer: config.deployerAddress,
      organizationOwner: config.organizationOwner
    },
    gateway: {
      deployer: config.deployerAddress,
      bounty: '100'
    }
  };
};

let getCompleteAuxiliaryConfig = function() {
  return {
    deployer: config.deployerAddress,
    gasPrice: '0',
    libs: {
      deployer: config.deployerAddress
    },
    organization: {
      deployer: config.deployerAddress,
      owner: config.organizationOwner,
      admin: config.organizationAdmin,
      worker: config.organizationWorker,
      completeOwnershipTransfer: false
    },
    safeCore: {
      remoteChainId: '12345',
      deployer: config.deployerAddress,
      organizationOwner: config.organizationOwner
    },
    ostPrime: {
      deployer: config.deployerAddress,
      chainOwner: config.chainOwner
    },
    cogateway: {
      deployer: config.deployerAddress,
      bounty: '100'
    }
  };
};

describe('test/ChainSetup', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  const orgConfig = {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    worker: config.organizationWorker,
    completeOwnershipTransfer: true
  };

  before(function() {
    //This hook may take some time.
    this.timeout(60000);
    //Add keys to web3 wallet.
    return web3WalletHelper.init(web3);
  });

  let originWeb3 = web3;
  let auxiliaryWeb3 = web3;
  let helper = new ChainSetup(originWeb3, auxiliaryWeb3);

  it('should do mosaic setup with exhaustive configurations', function() {
    this.timeout(1 * 60 * 60 * 1000); //1 hr.
    let originConfig = getCompleteOriginConfig();
    let auxiliaryConfig = getCompleteAuxiliaryConfig();
    let valueToken = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';
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
