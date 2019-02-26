'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const { ChainSetup } = require('../../index');

const { CoGatewayHelper } = ChainSetup;

const shared = require('../shared');

const assertReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

const assertDeploymentReceipt = (receipt) => {
  assertReceipt(receipt);
  const { contractAddress } = receipt;
  assert.isNotEmpty(
    contractAddress,
    'Deployment Receipt is missing contractAddress',
  );
  assert.isTrue(
    Web3.utils.isAddress(contractAddress),
    'Invalid contractAddress in Receipt',
  );
  return receipt;
};

describe('CoGatewayHelper', () => {
  let deployParams;

  const subject = new CoGatewayHelper(shared.auxiliary.web3);

  before(() => {
    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
  });

  it('should deploy new CoGateway contract', () => {
    const _token = shared.origin.addresses.EIP20Gateway;
    const _utilityToken = shared.auxiliary.addresses.OSTPrime;
    const _anchor = shared.auxiliary.addresses.Anchor;
    const _bounty = 1000;
    const _gateway = shared.origin.addresses.EIP20Gateway;

    return subject
      .deploy(
        _token,
        _utilityToken,
        _anchor,
        _bounty,
        _gateway,
        shared.auxiliary.addresses.Organization,
        shared.auxiliary.addresses.MessageBus,
        shared.auxiliary.addresses.GatewayLib,
        deployParams,
      )
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        shared.auxiliary.addresses.EIP20CoGateway = receipt.contractAddress;
      });
  });
});
