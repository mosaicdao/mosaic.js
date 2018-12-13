'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  OrganizationHelper = require('../../libs/helpers/OrganizationHelper'),
  GatewayHelper = require('../../libs/helpers/GatewayHelper'),
  LibsHelper = require('../../libs/helpers/LibsHelper'),
  assert = chai.assert;

const config = require('../../test/utils/configReader'),
  Web3WalletHelper = require('../../test/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caOrganization && caGateway = null below.
let caGateway = null;
let caOrganization = null;
let caMessageBusAddress = null;
let caGatewayLibAddress = null;
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
describe('test/helpers/GatewayHelper', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new GatewayHelper(web3, caGateway);

  before(function() {
    //This hook could take long time.
    this.timeout(3 * 60 * 1000);

    return web3WalletHelper
      .init(web3)
      .then(function(_out) {
        if (caOrganization) {
          return _out;
        }
        console.log('* Setting up Organization');
        let orgHelper = new OrganizationHelper(web3, caOrganization);
        const orgConfig = {
          deployer: config.deployerAddress,
          worker: config.organizationWorker
        };
        return orgHelper.setup(orgConfig).then(function() {
          caOrganization = orgHelper.address;
        });
      })
      .then(function(_out) {
        if (caMessageBusAddress && caGatewayLibAddress) {
          return _out;
        }
        console.log('* Setting up Libs');
        let libsHelper = new LibsHelper(web3);
        const libsConfig = {
          deployer: config.deployerAddress
        };
        return libsHelper.setup(libsConfig).then(function() {
          caMessageBusAddress = libsHelper.messageBusAddress;
          caGatewayLibAddress = libsHelper.gatewayLibAddress;
        });
      });
  });

  const someValidAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';
  if (!caGateway) {
    it('should deploy new Gateway contract', function() {
      let _token = someValidAddress;
      let _baseToken = someValidAddress;
      let _core = someValidAddress;
      let _bounty = 1000;

      return helper
        .deploy(
          _token,
          _baseToken,
          _core,
          _bounty,
          caOrganization,
          caMessageBusAddress,
          caGatewayLibAddress,
          deployParams
        )
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caGateway = receipt.contractAddress;
        });

      //let helper = new GatewayHelper(web3, caGateway);
    });
  }

  //Set Co-Core Address.
  it('should set activate gateway', function() {
    let caCoGateway = caGateway;
    //Note: Remember, deployer is still the owner of organization here.
    return helper.activateGateway(caCoGateway, deployParams).then(validateReceipt);
  });

  // //Test Setup
  // it('should setup SafeCore', function() {
  //   this.timeout(60000);
  //   let safeCoreConfig = {
  //     remoteChainId: 123456,
  //     deployer: config.deployerAddress,
  //     organization: caOrganization,
  //     coCoreAddress: caSafeCore,
  //     organizationOwner: organizationOwner
  //   };
  //   return helper.setup(safeCoreConfig, deployParams);
  // });
});

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
