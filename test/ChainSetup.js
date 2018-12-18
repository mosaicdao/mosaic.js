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
    gatewayOrganization: {
      deployer: config.deployerAddress,
      owner: config.organizationOwner,
      admin: config.organizationAdmin,
      workers: [config.organizationWorker]
    },
    gateway: {
      deployer: config.deployerAddress,
      bounty: '100'
    }
  };
};

let getCompleteAuxiliaryConfig = (function() {
  return {
    deployer: config.deployerAddress,
    gasPrice: '0',
    ostPrimeOrganization: {
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
    cogatewayOrganization: {
      deployer: config.deployerAddress,
      owner: config.organizationOwner,
      admin: config.organizationAdmin,
      workers: [config.organizationWorker]
    },
    cogateway: {
      deployer: config.deployerAddress,
      bounty: '100'
    }
  };
})(
  //To-Do: Write Test Case here.

  // Go easy on RPC Client (Geth)
  function() {
    let maxHttpScokets = 10;
    let httpModule = require('http');
    httpModule.globalAgent.keepAlive = true;
    httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
    httpModule.globalAgent.maxSockets = maxHttpScokets;
  }
)();
