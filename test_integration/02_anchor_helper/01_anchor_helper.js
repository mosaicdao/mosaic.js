'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const OrganizationHelper = require('../../libs/helpers/setup/OrganizationHelper');
const AnchorHelper = require('../../libs/helpers/setup/AnchorHelper');

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

describe('AnchorHelper', () => {
  let addressOrganization;
  let addressAnchor;

  let helper = new AnchorHelper(shared.origin.web3, shared.auxiliary.web3, addressAnchor);

  let remoteChainId = '123456';
  let initialBlockHeight;
  let initialStateRoot;

  before(async () => {
    const config = shared.setupConfig;

    let orgHelper = new OrganizationHelper(shared.origin.web3, addressOrganization);
    const orgConfig = {
      deployer: config.deployerAddress,
      owner: config.deployerAddress
    };
    await orgHelper.setup(orgConfig).then(() => {
      addressOrganization = orgHelper.address;
    });

    // Get BlockHeight and StateRoot
    await shared.auxiliary.web3.eth.getBlock('latest').then((block) => {
      initialBlockHeight = block.number;
      initialStateRoot = block.stateRoot;
    });
  });

  it('should deploy new Anchor contract', () => {
    let deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice
    };
    return helper
      .deploy(remoteChainId, initialBlockHeight, initialStateRoot, 10, addressOrganization, deployParams)
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        addressAnchor = receipt.contractAddress;
      });
  });

  // Set Co-Anchor Address.
  it('should set co-anchor address', () => {
    let deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice
    };
    return helper.setCoAnchorAddress(addressAnchor, deployParams).then(assertReceipt);
  });

  // Test Setup
  it('should setup Anchor', () => {
    let deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice
    };
    let anchorConfig = {
      remoteChainId: 123456,
      deployer: shared.setupConfig.deployerAddress,
      organization: addressOrganization,
      coAnchorAddress: addressAnchor,
      maxStateRoots: 10,
      organizationOwner: shared.setupConfig.deployerAddress
    };
    return helper.setup(anchorConfig, deployParams);
  });
});
