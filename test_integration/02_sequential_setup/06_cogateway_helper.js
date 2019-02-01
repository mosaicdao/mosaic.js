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

const CoGatewayHelper = require('../../src/helpers/setup/CoGatewayHelper');

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

describe('CoGatewayHelper', () => {
  let deployParams;

  let organizationOwner;

  const subject = new CoGatewayHelper(shared.auxiliary.web3);

  before(() => {
    deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    organizationOwner = shared.setupConfig.deployerAddress;
  });

  const someValidAddress = '0x2222222222222222222222222222222222222222';
  it('should deploy new CoGateway contract', () => {
    const _token = someValidAddress;
    const _utilityToken = shared.auxiliary.addresses.OSTPrime;
    const _anchor = shared.auxiliary.addresses.Anchor;
    const _bounty = 1000;
    const _gateway = shared.origin.addresses.Gateway;

    return subject
      .deploy(
        _token,
        _utilityToken,
        _anchor,
        _bounty,
        _gateway,
        shared.auxiliary.addresses.Organization,
        shared.auxiliary.addresses.MessageBus,
        shared.auxiliary.addresses.GatewayLib,
        deployParams,
      )
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        shared.auxiliary.addresses.CoGateway = receipt.contractAddress;
      });
  });
});
