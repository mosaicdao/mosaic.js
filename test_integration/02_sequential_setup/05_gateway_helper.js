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

const GatewayHelper = require('../../libs/helpers/setup/GatewayHelper');

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

describe('GatewayHelper', () => {
  let deployParams;

  const subject = new GatewayHelper(shared.origin.web3);

  before(() => {
    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
  });

  const someValidAddress = '0x1111111111111111111111111111111111111111';
  it('should deploy new Gateway contract', () => {
    const _token = someValidAddress;
    const _baseToken = someValidAddress;
    const _anchor = someValidAddress;
    const _bounty = 1000;

    return subject
      .deploy(
        _token,
        _baseToken,
        _anchor,
        _bounty,
        shared.origin.addresses.Organization,
        shared.origin.addresses.MessageBus,
        shared.origin.addresses.GatewayLib,
        deployParams,
      )
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        shared.origin.addresses.Gateway = receipt.contractAddress;
      });
  });

  // Test Setup
  it('should setup Gateway and CoGateway', () => {
    const simpleToken = someValidAddress;

    const gatewayConfig = {
      deployer: shared.setupConfig.deployerAddress,
      token: simpleToken,
      baseToken: simpleToken,
      organization: shared.origin.addresses.Organization,
      organizationOwner: shared.setupConfig.organizationOwner,
      anchor: shared.origin.addresses.Anchor,
      bounty: '123456',
      messageBus: shared.origin.addresses.MessageBus,
      gatewayLib: shared.origin.addresses.GatewayLib,
    };

    const coGatewayConfig = {
      deployer: shared.setupConfig.deployerAddress,
      valueToken: simpleToken,
      utilityToken: shared.auxiliary.addresses.OSTPrime,
      organization: shared.auxiliary.addresses.Organization,
      anchor: shared.auxiliary.addresses.Anchor,
      bounty: '123456',
      messageBus: shared.auxiliary.addresses.MessageBus,
      gatewayLib: shared.auxiliary.addresses.GatewayLib,
    };

    return subject.setup(
      gatewayConfig,
      coGatewayConfig,
      deployParams,
      deployParams,
      shared.origin.web3,
      shared.auxiliary.web3,
    );
  });
});
