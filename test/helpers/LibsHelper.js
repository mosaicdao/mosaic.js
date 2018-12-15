'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  LibsHelper = require('../../libs/helpers/LibsHelper'),
  assert = chai.assert;

const config = require('../../test/utils/configReader'),
  Web3WalletHelper = require('../../test/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Organisation Contract Address. TBD: Do not forget to set addresses = null below.
let caMerklePatriciaProof = null;
let caMessageBus = null;
let caGatewayLib = null;

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
describe('test/helpers/LibsHelper', function() {
  let deployParams = {
    from: config.deployerAddress,
    gasPrice: config.gasPrice
  };

  let helper = new LibsHelper(web3, caMerklePatriciaProof, caMessageBus, caGatewayLib);

  before(function() {
    return web3WalletHelper.init(web3);
  });

  if (!caMerklePatriciaProof) {
    it('should deploy new MerklePatriciaProof Library', function() {
      return helper
        .deployMerklePatriciaProof(deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caMerklePatriciaProof = receipt.contractAddress;
        });
    });
  }

  if (!caMessageBus) {
    it('should deploy new MessageBus Library', function() {
      return helper
        .deployMessageBus(caMerklePatriciaProof, deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caMessageBus = receipt.contractAddress;
        });
    });
  }

  if (!caGatewayLib) {
    it('should deploy new GatewayLib Library', function() {
      return helper
        .deployGatewayLib(caMerklePatriciaProof, deployParams)
        .then(validateDeploymentReceipt)
        .then((receipt) => {
          caGatewayLib = receipt.contractAddress;
        });
    });
  }

  it('should setup all Libs', function() {
    let libsHelperConfig = {
      deployer: config.deployerAddress
    };
    return helper.setup(libsHelperConfig, deployParams).then(function() {
      caMerklePatriciaProof = helper.merklePatriciaProof;
      caMessageBus = helper.messageBus;
      caGatewayLib = helper.gatewayLib;
      console.log(
        'Validating Lib Addresses:',
        '\n\t merklePatriciaProof',
        caMerklePatriciaProof,
        '\n\t messageBus',
        caMessageBus,
        '\n\t gatewayLib',
        caGatewayLib
      );
      assert.isTrue(Web3.utils.isAddress(caMerklePatriciaProof));
      assert.isTrue(Web3.utils.isAddress(caMessageBus));
      assert.isTrue(Web3.utils.isAddress(caGatewayLib));
    });
  });
});
