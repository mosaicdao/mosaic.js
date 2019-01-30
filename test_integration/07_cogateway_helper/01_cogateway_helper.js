'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const CoGatewayHelper = require('../../libs/helpers/setup/CoGatewayHelper');

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

describe('CoGatewayHelper', () => {
  let deployParams;

  let addressCoGateway;
  let organizationOwner;

  let helper = new CoGatewayHelper(shared.auxiliary.web3, addressCoGateway);

  before(() => {
    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice
    };
    organizationOwner = shared.setupConfig.deployerAddress;
  });

  const someValidAddress = '0x2222222222222222222222222222222222222222';
  it('should deploy new CoGateway contract', () => {
    let _token = someValidAddress;
    let _utilityToken = someValidAddress;
    let _anchor = someValidAddress;
    let _bounty = 1000;
    let _gateway = someValidAddress;

    return helper
      .deploy(
        _token,
        _utilityToken,
        _anchor,
        _bounty,
        _gateway,
        shared.auxiliary.addresses.Organization,
        shared.auxiliary.addresses.MessageBus,
        shared.auxiliary.addresses.GatewayLib,
        deployParams
      )
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        addressCoGateway = receipt.contractAddress;
      });
  });
});
