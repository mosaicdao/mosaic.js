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

const LibsHelper = require('../../libs/helpers/setup/LibsHelper');

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

describe('LibsHelper', () => {
  let addressMerklePatriciaProof;
  let addressMessageBus;
  let addressGatewayLib;

  const subject = new LibsHelper(shared.origin.web3);

  after(() => {
    const auxiliaryHelper = new LibsHelper(shared.auxiliary.web3);

    const deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    const libsHelperConfig = {
      deployer: shared.setupConfig.deployerAddress,
    };
    return auxiliaryHelper.setup(libsHelperConfig, deployParams).then(() => {
      // set addresses for following tests
      shared.auxiliary.addresses.MerklePatriciaProof =
        auxiliaryHelper.merklePatriciaProof;
      shared.auxiliary.addresses.MessageBus = auxiliaryHelper.messageBus;
      shared.auxiliary.addresses.GatewayLib = auxiliaryHelper.gatewayLib;
    });
  });

  it('should deploy new MerklePatriciaProof Library', () => {
    let deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    return subject
      .deployMerklePatriciaProof(deployParams)
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        addressMerklePatriciaProof = receipt.contractAddress;
      })
      .then(() => {
        assert.isTrue(
          Web3.utils.isAddress(addressMerklePatriciaProof),
          'MerklePatriciaProof contract was not deployed correctly.',
        );
      });
  });

  it('should deploy new MessageBus Library', () => {
    let deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    return subject
      .deployMessageBus(addressMerklePatriciaProof, deployParams)
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        addressMessageBus = receipt.contractAddress;
      })
      .then(() => {
        assert.isTrue(
          Web3.utils.isAddress(addressMessageBus),
          'MessageBus contract was not deployed correctly.',
        );
      });
  });

  it('should deploy new GatewayLib Library', () => {
    let deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    return subject
      .deployGatewayLib(addressMerklePatriciaProof, deployParams)
      .then(assertDeploymentReceipt)
      .then((receipt) => {
        addressGatewayLib = receipt.contractAddress;
      })
      .then(() => {
        assert.isTrue(
          Web3.utils.isAddress(addressGatewayLib),
          'GatewayLib contract was not deployed correctly.',
        );
      });
  });

  it('should setup all Libs', () => {
    let deployParams = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
    };
    let libsHelperConfig = {
      deployer: shared.setupConfig.deployerAddress,
    };
    return subject.setup(libsHelperConfig, deployParams).then(() => {
      addressMerklePatriciaProof = subject.merklePatriciaProof;
      addressMessageBus = subject.messageBus;
      addressGatewayLib = subject.gatewayLib;

      assert.isTrue(
        Web3.utils.isAddress(addressMerklePatriciaProof),
        'MerklePatriciaProof contract was not deployed correctly.',
      );
      assert.isTrue(
        Web3.utils.isAddress(addressMessageBus),
        'MessageBus contract was not deployed correctly.',
      );
      assert.isTrue(
        Web3.utils.isAddress(addressGatewayLib),
        'GatewayLib contract was not deployed correctly.',
      );

      // set addresses for following tests
      shared.origin.addresses.MerklePatriciaProof =
        subject.merklePatriciaProof;
      shared.origin.addresses.MessageBus = subject.messageBus;
      shared.origin.addresses.GatewayLib = subject.gatewayLib;
    });
  });
});
