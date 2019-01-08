'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  OSTPrimeHelper = require('../../libs/helpers/OSTPrimeHelper'),
  OrganizationHelper = require('../../libs/helpers/OrganizationHelper'),
  assert = chai.assert;

const config = require('../../test/utils/configReader'),
  Web3WalletHelper = require('../../test/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caOSTPrime = null below.
//ca stands for contract address.
let caOSTPrime = null;
let caOrganization = null;
let chainOwner = config.chainOwner;

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

const fName = 'OSTPrimeHelper';
const SimpleTokenAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';

describe('test/helpers/OSTPrimeHelper', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new OSTPrimeHelper(web3, caOSTPrime);

  before(function() {
    this.timeout(3 * 60000);
    //This hook could take long time.
    return web3WalletHelper.init(web3).then(function(_out) {
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
    });
  });

  if (!caOSTPrime) {
    it('should deploy new OSTPrime contract', function() {
      this.timeout(60000);
      return helper
        .deploy(SimpleTokenAddress, caOrganization, deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caOSTPrime = receipt.contractAddress;
        });
    });
  }

  //Initialize OSTPrime
  it('should initialize OSTPrime', function() {
    this.timeout(60000);
    let ownerParams = Object.assign({}, deployParams);
    ownerParams.from = config.chainOwner;
    return helper.initialize(ownerParams).then(validateReceipt);
  });

  //NOTE: setCoGateway can not be uint tested. Need to deploy actual co-gateway for it.
  //Set CoGateway on OSTPrime - to be done from owner.
  // it('should set CoGateway on OSTPrime', function() {
  //   this.timeout(60000);
  //   let ownerParams = Object.assign({}, deployParams);
  //   let someValidAddress = SimpleTokenAddress;
  //   ownerParams.from = config.chainOwner;
  //   return helper.setCoGateway(someValidAddress, ownerParams);
  // });

  //Test Setup
  it('should setup OSTPrime', function() {
    this.timeout(60000);
    const ostPrimeConfig = {
      deployer: config.deployerAddress,
      organization: caOrganization,
      chainOwner: chainOwner
    };
    return helper.setup(SimpleTokenAddress, ostPrimeConfig, deployParams);
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
