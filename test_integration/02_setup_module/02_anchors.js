'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
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

    assert.strictEqual(
      Web3.utils.isAddress(originAnchor.address),
      true,
      `Anchor does not have a valid address: ${originAnchor.address}`,
    );
    assert.strictEqual(
      Web3.utils.isAddress(auxiliaryAnchor.address),
      true,
      `CoAnchor does not have a valid address: ${auxiliaryAnchor.address}`,
    );

    shared.setupModule.originAnchor = originAnchor;
    shared.setupModule.auxiliaryAnchor = auxiliaryAnchor;
  });

  it('should accept anchored state roots on origin', async () => {
    const txOptions = {
      from: shared.setupConfig.deployerAddress,
      gas: '7000000',
      gasPrice: shared.setupConfig.gasPrice,
    };
    const anchor = shared.setupModule.originAnchor;
    const blockHeight = '5000000';
    const stateRoot = Web3.utils.sha3('19850912');

    await anchor.anchorStateRoot(blockHeight, stateRoot, txOptions);

    const storedRoot = await anchor.getStateRoot(blockHeight, txOptions);
    assert.strictEqual(
      storedRoot,
      stateRoot,
      'Origin anchor did not store the state root correctly.',
    );
  });

  it('should accept anchored state roots on auxiliary', async () => {
    const txOptions = {
      from: shared.setupConfig.deployerAddress,
      gas: '7000000',
      gasPrice: shared.setupConfig.gasPrice,
    };
    const anchor = shared.setupModule.auxiliaryAnchor;
    const blockHeight = '2000000000';
    const stateRoot = Web3.utils.sha3('2020');

    await anchor.anchorStateRoot(blockHeight, stateRoot, txOptions);

    const storedRoot = await anchor.getStateRoot(blockHeight, txOptions);
    assert.strictEqual(
      storedRoot,
      stateRoot,
      'Auxiliary anchor did not store the state root correctly.',
    );
  });
});
