// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const AnchorHelper = require('../../src/helpers/setup/AnchorHelper');

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

describe('AnchorHelper', () => {
  let addressOrganization;
  let addressAnchor;

  const subject = new AnchorHelper(shared.origin.web3, shared.auxiliary.web3);

  const remoteChainId = '123456';
  let initialBlockHeight;
  let initialStateRoot;

  before(async () => {
    const config = shared.setupConfig;

    addressOrganization = shared.origin.addresses.Organization;

    await shared.auxiliary.web3.eth.getBlock('latest').then((block) => {
      initialBlockHeight = block.number;
      initialStateRoot = block.stateRoot;
    });
  });

  after(async () => {
    const deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };

    // use a new helper on origin, as we have already called `setCoAnchorAddress`
    // on the helper we use in the tests here
    const originHelper = new AnchorHelper(
      shared.origin.web3,
      shared.auxiliary.web3,
    );
    await originHelper
      .deploy(
        remoteChainId,
        initialBlockHeight,
        initialStateRoot,
        10,
        addressOrganization,
        deployParams,
      )
      .then((receipt) => {
        shared.origin.addresses.Anchor = receipt.contractAddress;
      });

    const originChainId = await shared.origin.web3.eth.net.getId();
    const {
      originInitialBlockHeight,
      originInitialStateRoot,
    } = await shared.auxiliary.web3.eth.getBlock('latest').then((block) => ({
      originInitialBlockHeight: block.number,
      originInitialStateRoot: block.stateRoot,
    }));

    const auxiliaryHelper = new AnchorHelper(
      shared.auxiliary.web3,
      shared.origin.web3,
    );
    await auxiliaryHelper
      .deploy(
        originChainId,
        originInitialBlockHeight,
        originInitialStateRoot,
        10,
        shared.auxiliary.addresses.Organization,
        deployParams,
      )
      .then((receipt) => {
        shared.auxiliary.addresses.Anchor = receipt.contractAddress;
      });
  });

  it('should deploy new Anchor contract', () => {
    const deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    return subject
      .deploy(
        remoteChainId,
        initialBlockHeight,
        initialStateRoot,
        10,
        addressOrganization,
        deployParams,
      )
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        addressAnchor = receipt.contractAddress;
      });
  });

  it('should set co-anchor address', () => {
    const deployParams = {
      from: shared.setupConfig.organizationOwner,
      gasPrice: shared.setupConfig.gasPrice,
    };
    return subject
      .setCoAnchorAddress(addressAnchor, deployParams)
      .then(assertReceipt);
  });

  it('should setup Anchor', () => {
    const deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    const anchorConfig = {
      remoteChainId: 123456,
      deployer: shared.setupConfig.deployerAddress,
      organization: addressOrganization,
      coAnchorAddress: addressAnchor,
      maxStateRoots: 10,
      organizationOwner: shared.setupConfig.organizationOwner,
    };
    return subject.setup(anchorConfig, deployParams);
  });
});
