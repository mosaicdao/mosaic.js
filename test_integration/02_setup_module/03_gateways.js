'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const Setup = require('../../src/Setup');
const shared = require('../shared');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('Setup.gateways', () => {
  let originTxOptions;
  let auxiliaryTxOptions;

  before(() => {
    originTxOptions = {
      gasPrice: shared.setupConfig.gasPrice,
    };
    auxiliaryTxOptions = {
      gasPrice: shared.setupConfig.gasPrice,
    };
  });

  it('should deploy new gateways', async () => {
    const originConfig = {
      token: shared.origin.addresses.EIP20Token,
      baseToken: shared.origin.addresses.OST,
      stateRootProvider: shared.setupModule.originAnchor.address,
      bounty: '10',
      organization: shared.setupModule.originOrganization.address,
      burner: ZERO_ADDRESS,
      deployer: shared.setupConfig.deployerAddress,
      organizationOwner: shared.setupConfig.deployerAddress,
    };
    const auxiliaryConfig = {
      utilityToken: shared.auxiliary.addresses.OSTPrime,
      stateRootProvider: shared.setupModule.auxiliaryAnchor.address,
      bounty: '10',
      organization: shared.setupModule.auxiliaryOrganization.address,
      burner: ZERO_ADDRESS,
      deployer: shared.setupConfig.deployerAddress,
      organizationOwner: shared.setupConfig.deployerAddress,
    };

    const [originGateway, auxiliaryCoGateway] = await Setup.gateways(
      shared.origin.web3,
      shared.auxiliary.web3,
      originConfig,
      auxiliaryConfig,
      originTxOptions,
      auxiliaryTxOptions,
    );

    assert.strictEqual(
      Web3.utils.isAddress(originGateway.address),
      true,
      `Gateway does not have a valid address: ${originGateway.address}`,
    );
    assert.strictEqual(
      Web3.utils.isAddress(auxiliaryCoGateway.address),
      true,
      `CoGateway does not have a valid address: ${auxiliaryCoGateway.address}`,
    );

    shared.setupModule.originGateway = originGateway.address;
    shared.setupModule.auxiliaryCoGateway = auxiliaryCoGateway.address;
  });
});
