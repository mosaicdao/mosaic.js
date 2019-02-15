'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
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

    assert.strictEqual(
      Web3.utils.isAddress(originOrganization.address),
      true,
      `Origin organization does not have a valid address: ${
        originOrganization.address
      }`,
    );
    assert.strictEqual(
      Web3.utils.isAddress(auxiliaryOrganization.address),
      true,
      `Auxiliary organization does not have a valid address: ${
        auxiliaryOrganization.address
      }`,
    );

    shared.setupModule.originOrganization = originOrganization;
    shared.setupModule.auxiliaryOrganization = auxiliaryOrganization;
  });
});
