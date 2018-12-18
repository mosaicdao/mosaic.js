'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  OrganizationHelper = require('../../libs/helpers/OrganizationHelper'),
  CoGatewayHelper = require('../../libs/helpers/CoGatewayHelper'),
  LibsHelper = require('../../libs/helpers/LibsHelper'),
  assert = chai.assert;

const config = require('../../test/utils/configReader'),
  Web3WalletHelper = require('../../test/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caOrganization && caCoGateway = null below.
let caCoGateway = null;
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
describe('test/helpers/CoGatewayHelper', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new CoGatewayHelper(web3, caCoGateway);

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
          owner: config.deployerAddress
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
          caMessageBusAddress = libsHelper.messageBus;
          caGatewayLibAddress = libsHelper.gatewayLib;
        });
      });
  });

  const someValidAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';
  if (!caCoGateway) {
    it('should deploy new CoGateway contract', function() {
      this.timeout(1 * 60 * 1000);
      let _token = someValidAddress;
      let _baseToken = someValidAddress;
      let _anchor = someValidAddress;
      let _bounty = 1000;
      let _gateway = someValidAddress;

      return helper
        .deploy(
          _token,
          _baseToken,
          _anchor,
          _bounty,
          _gateway,
          caOrganization,
          caMessageBusAddress,
          caGatewayLibAddress,
          deployParams
        )
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caCoGateway = receipt.contractAddress;
        });
    });
  }
});

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
