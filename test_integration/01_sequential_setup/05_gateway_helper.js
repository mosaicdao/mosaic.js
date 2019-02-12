'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const { ChainSetup } = require('../../index');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');

const { GatewayHelper } = ChainSetup;

const shared = require('../shared');

const assertReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

const assertDeploymentReceipt = (receipt) => {
  assertReceipt(receipt);
  const contractAddress = receipt.contractAddress;
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

describe('GatewayHelper', () => {
  let deployParams;

  before(() => {
    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
  });

  const someValidAddress = '0x1111111111111111111111111111111111111111';
  it('should deploy new Gateway contract', () => {
    const _token = someValidAddress;
    const _baseToken = someValidAddress;
    const _anchor = someValidAddress;
    const _bounty = 1000;

    const subject = new GatewayHelper(shared.origin.web3);

    return subject
      .deploy(
        _token,
        _baseToken,
        _anchor,
        _bounty,
        shared.origin.addresses.Organization,
        shared.origin.addresses.MessageBus,
        shared.origin.addresses.GatewayLib,
        deployParams,
      )
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        shared.origin.addresses.Gateway = receipt.contractAddress;
      });
  });

  // Test Setup
  it('should setup Gateway and CoGateway', () => {
    const simpleToken = someValidAddress;

    const gatewayConfig = {
      deployer: shared.setupConfig.deployerAddress,
      token: simpleToken,
      baseToken: simpleToken,
      organization: shared.origin.addresses.Organization,
      organizationOwner: shared.setupConfig.organizationOwner,
      stateRootProvider: shared.origin.addresses.Anchor,
      bounty: '123456',
      burner: '0x0000000000000000000000000000000000000000',
      messageBus: shared.origin.addresses.MessageBus,
      gatewayLib: shared.origin.addresses.GatewayLib,
    };

    const coGatewayConfig = {
      deployer: shared.setupConfig.deployerAddress,
      valueToken: simpleToken,
      utilityToken: shared.auxiliary.addresses.OSTPrime,
      organization: shared.auxiliary.addresses.Organization,
      stateRootProvider: shared.auxiliary.addresses.Anchor,
      bounty: '123456',
      burner: '0x0000000000000000000000000000000000000000',
      messageBus: shared.auxiliary.addresses.MessageBus,
      gatewayLib: shared.auxiliary.addresses.GatewayLib,
    };

    return EIP20Gateway.setupPair(
      shared.origin.web3,
      shared.auxiliary.web3,
      gatewayConfig,
      coGatewayConfig,
      deployParams,
      deployParams,
    ).then(({ EIP20Gateway: gateway, EIP20CoGateway: coGateway }) => {
      assert.isTrue(
        Web3.utils.isAddress(gateway.address),
        'Invalid EIP20Gateway address returned from setupPair',
      );
      assert.isTrue(
        Web3.utils.isAddress(coGateway.address),
        'Invalid EIP20CoGateway address returned from setupPair',
      );
    });
  });
});
