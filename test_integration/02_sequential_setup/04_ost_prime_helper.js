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

const OSTPrimeHelper = require('../../src/helpers/setup/OSTPrimeHelper');

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

describe('OSTPrimeHelper', () => {
  const ValueTokenAddress = '0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca';

  let chainOwner;
  let deployParams;

  let addressOrganization;

  const subject = new OSTPrimeHelper(shared.auxiliary.web3);

  before(() => {
    chainOwner = shared.setupConfig.chainOwner;

    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };

    addressOrganization = shared.auxiliary.addresses.Organization;
  });

  it('should deploy new OSTPrime contract', () => {
    return subject
      .deploy(ValueTokenAddress, addressOrganization, deployParams)
      .then(assertDeploymentReceipt);
  });

  // Initialize OSTPrime
  it('should initialize OSTPrime', () => {
    const ownerParams = Object.assign({}, deployParams, {
      from: chainOwner,
    });
    return subject.initialize(ownerParams).then(assertReceipt);
  });

  // Test Setup
  it('should setup OSTPrime', () => {
    const ostPrimeConfig = {
      deployer: shared.setupConfig.deployerAddress,
      organization: addressOrganization,
      chainOwner: chainOwner,
    };
    return subject
      .setup(ValueTokenAddress, ostPrimeConfig, deployParams)
      .then(() => {
        shared.auxiliary.addresses.OSTPrime = subject.address;
      });
  });
});
