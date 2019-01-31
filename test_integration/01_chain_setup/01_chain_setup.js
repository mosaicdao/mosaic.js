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

const shared = require('../shared');
const { ChainSetup } = require('../../index');

const MockContractsDeployer = require('../../tests/utils/MockContractsDeployer');

describe('ChainSetup', () => {
  let addressMockToken;

  before(async () => {
    const deployer = new MockContractsDeployer(shared.setupConfig.deployerAddress, shared.origin.web3);
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
        workers: [config.organizationWorker]
      },
      anchorOrganization: {
        deployer: config.deployerAddress,
        owner: config.organizationOwner,
        admin: config.organizationAdmin,
        workers: [config.organizationWorker]
      },
      libs: {
        deployer: config.deployerAddress
      },
      anchor: {
        remoteChainId: '12345',
        deployer: config.deployerAddress,
        organizationOwner: config.organizationOwner
      },

      gateway: {
        deployer: config.deployerAddress,
        bounty: '100'
      }
    };

    let auxiliaryConfig = {
      gasPrice: '0',
      tokenOrganization: {
        deployer: config.deployerAddress,
        owner: config.organizationOwner,
        admin: config.organizationAdmin,
        workers: [config.organizationWorker]
      },
      ostPrime: {
        deployer: config.deployerAddress,
        chainOwner: config.chainOwner
      },
      anchorOrganization: {
        deployer: config.deployerAddress,
        owner: config.organizationOwner,
        admin: config.organizationAdmin,
        workers: [config.organizationWorker]
      },
      anchor: {
        remoteChainId: '12345',
        deployer: config.deployerAddress,
        organizationOwner: config.organizationOwner
      },
      libs: {
        deployer: config.deployerAddress
      },
      cogateway: {
        deployer: config.deployerAddress,
        bounty: '100'
      }
    };

    return subject.setup(valueToken, originConfig, auxiliaryConfig);
  });
});
