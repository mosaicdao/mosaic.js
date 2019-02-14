'use strict';

const Setup = require('../../src/Setup');
const shared = require('../shared');

describe('Setup.organizations', () => {
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

  it('should deploy new organizations', async () => {
    const originConfig = {
      deployer: shared.setupConfig.deployerAddress,
      owner: shared.setupConfig.deployerAddress,
      admin: shared.setupConfig.deployerAddress,
      workers: [],
      workerExpirationHeight: '0',
    };
    const auxiliaryConfig = {
      deployer: shared.setupConfig.deployerAddress,
      owner: shared.setupConfig.deployerAddress,
      admin: shared.setupConfig.deployerAddress,
      workers: [],
      workerExpirationHeight: '0',
    };

    const [
      originOrganization,
      auxiliaryOrganization,
    ] = await Setup.organizations(
      shared.origin.web3,
      shared.auxiliary.web3,
      originConfig,
      auxiliaryConfig,
      originTxOptions,
      auxiliaryTxOptions,
    );

    shared.setupModule.originOrganization = originOrganization;
    shared.setupModule.auxiliaryOrganization = auxiliaryOrganization;
  });
});
