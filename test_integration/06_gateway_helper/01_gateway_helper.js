'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const GatewayHelper = require('../../libs/helpers/setup/GatewayHelper');

const shared = require('../shared');

const assertReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

const assertDeploymentReceipt = (receipt) => {
  assertReceipt(receipt);
  let contractAddress = receipt.contractAddress;
  assert.isNotEmpty(contractAddress, 'Deployment Receipt is missing contractAddress');
  assert.isTrue(Web3.utils.isAddress(contractAddress), 'Invalid contractAddress in Receipt');
  return receipt;
};

describe('GatewayHelper', () => {
  let deployParams;

  let addressGateway;
  let organizationOwner;

  let helper = new GatewayHelper(shared.origin.web3, addressGateway);

  before(() => {
    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice
    };
    organizationOwner = shared.setupConfig.deployerAddress;
  });

  const someValidAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';
  it('should deploy new Gateway contract', () => {
    let _token = someValidAddress;
    let _baseToken = someValidAddress;
    let _anchor = someValidAddress;
    let _bounty = 1000;

    return helper
      .deploy(
        _token,
        _baseToken,
        _anchor,
        _bounty,
        shared.origin.addresses.Organization,
        shared.origin.addresses.MessageBus,
        shared.origin.addresses.GatewayLib,
        deployParams
      )
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        addressGateway = receipt.contractAddress;
      });
  });

  // TODO: Set Co-Gateway Address.; Move to activation step of integration tests
  // it('should activate gateway', () => {
  //   let addressCoGateway = addressGateway;
  //   //Note: Remember, deployer is still the owner of organization here.
  //   return helper.activateGateway(addressCoGateway, deployParams).then(assertReceipt);
  // });

  // Test Setup
  it.skip('should setup Gateway and CoGateway', () => {
    let simpleToken = someValidAddress;
    let ostPrime = someValidAddress;

    let gatewayConfig = {
      deployer: shared.setupConfig.deployerAddress,
      token: simpleToken,
      baseToken: simpleToken,
      organization: shared.origin.addresses.Organization,
      organizationOwner: organizationOwner,
      anchor: someValidAddress,
      bounty: '123456',
      messageBus: shared.origin.addresses.MessageBus,
      gatewayLib: shared.origin.addresses.GatewayLib
    };

    let coGatewayConfig = {
      deployer: shared.setupConfig.deployerAddress,
      valueToken: simpleToken,
      utilityToken: ostPrime,
      organization: shared.auxiliary.addresses.Organization,
      anchor: someValidAddress,
      bounty: '123456',
      messageBus: shared.auxiliary.addresses.MessageBus,
      gatewayLib: shared.auxiliary.addresses.GatewayLib
    };

    return helper.setup(
      gatewayConfig,
      coGatewayConfig,
      deployParams,
      deployParams,
      shared.origin.web3,
      shared.auxiliary.web3
    );
  });
});
