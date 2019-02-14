'use strict';

const Setup = require('../../src/Setup');
const shared = require('../shared');

describe('Setup.anchors', () => {
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

  it('should deploy new anchors', async () => {
    const originConfig = {
      remoteChainId: '1',
      maxStateRoots: '10',
      organization: shared.setupModule.originOrganization.address,
      organizationOwner: shared.setupConfig.deployerAddress,
      deployer: shared.setupConfig.deployerAddress,
    };
    const auxiliaryConfig = {
      remoteChainId: '2',
      maxStateRoots: '30',
      organization: shared.setupModule.auxiliaryOrganization.address,
      organizationOwner: shared.setupConfig.deployerAddress,
      deployer: shared.setupConfig.deployerAddress,
    };

    const [originAnchor, auxiliaryAnchor] = await Setup.anchors(
      shared.origin.web3,
      shared.auxiliary.web3,
      originConfig,
      auxiliaryConfig,
      originTxOptions,
      auxiliaryTxOptions,
    );

    shared.setupModule.originAnchor = originAnchor;
    shared.setupModule.auxiliaryAnchor = auxiliaryAnchor;
  });
});
