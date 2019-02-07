'use strict';

const shared = require('../shared');
const { ChainSetup } = require('../../index');

const MockContractsDeployer = require('../../tests/utils/MockContractsDeployer');

describe('ChainSetup', () => {
  let addressMockToken;

  before(async () => {
    const deployer = new MockContractsDeployer(
      shared.setupConfig.deployerAddress,
      shared.origin.web3,
    );
    return deployer.deployMockToken().then(() => {
      addressMockToken = deployer.addresses.MockToken;
    });
  });

  it('should do mosaic setup with exhaustive configurations', () => {
    const valueToken = addressMockToken;
    const subject = new ChainSetup(shared.origin.web3, shared.auxiliary.web3);

    const config = shared.setupConfig;
    let originConfig = {
      gasPrice: '0x5B9ACA00',
      tokenOrganization: {
        deployer: config.deployerAddress,
        owner: config.organizationOwner,
        admin: config.organizationAdmin,
        workers: [config.organizationWorker],
      },
      anchorOrganization: {
        deployer: config.deployerAddress,
        owner: config.organizationOwner,
        admin: config.organizationAdmin,
        workers: [config.organizationWorker],
      },
      libs: {
        deployer: config.deployerAddress,
      },
      anchor: {
        remoteChainId: '12345',
        deployer: config.deployerAddress,
        organizationOwner: config.organizationOwner,
      },

      gateway: {
        deployer: config.deployerAddress,
        bounty: '100',
      },
    };

    let auxiliaryConfig = {
      gasPrice: '0',
      tokenOrganization: {
        deployer: config.deployerAddress,
        owner: config.organizationOwner,
        admin: config.organizationAdmin,
        workers: [config.organizationWorker],
      },
      ostPrime: {
        deployer: config.deployerAddress,
        chainOwner: config.chainOwner,
      },
      anchorOrganization: {
        deployer: config.deployerAddress,
        owner: config.organizationOwner,
        admin: config.organizationAdmin,
        workers: [config.organizationWorker],
      },
      anchor: {
        remoteChainId: '12345',
        deployer: config.deployerAddress,
        organizationOwner: config.organizationOwner,
      },
      libs: {
        deployer: config.deployerAddress,
      },
      cogateway: {
        deployer: config.deployerAddress,
        bounty: '100',
      },
    };

    return subject.setup(valueToken, originConfig, auxiliaryConfig);
  });
});
