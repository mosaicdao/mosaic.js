'use strict';

const { assert } = require('chai');
const Web3 = require('web3');

const { ChainSetup } = require('../../index');
const GatewayLib = require('../../src/ContractInteract/GatewayLib');
const MerklePatriciaProof = require('../../src/ContractInteract/MerklePatriciaProof');
const MessageBus = require('../../src/ContractInteract/MessageBus');

const { LibsHelper } = ChainSetup;

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
    // const auxiliaryHelper = new LibsHelper(shared.auxiliary.web3);

    const deployParams = {
      from: shared.setupConfig.deployerAddress,
      gas: '5000000',
      gasPrice: shared.setupConfig.gasPrice,
    };

    const merklePatriciaProof = MerklePatriciaProof.deploy(
      shared.auxiliary.web3,
      deployParams,
    ).then((lib) => lib.address);
    const messageBus = merklePatriciaProof.then((proofLibAddress) =>
      MessageBus.deploy(
        shared.auxiliary.web3,
        proofLibAddress,
        deployParams,
      ).then((lib) => lib.address),
    );
    const gatewayLib = merklePatriciaProof.then((proofLibAddress) =>
      GatewayLib.deploy(
        shared.auxiliary.web3,
        proofLibAddress,
        deployParams,
      ).then((lib) => lib.address),
    );

    return Promise.all([merklePatriciaProof, messageBus, gatewayLib]).then(
      ([merklePatriciaProofAddress, messageBusAddress, gatewayLibAddress]) => {
        // set addresses for following tests
        shared.auxiliary.addresses.MerklePatriciaProof = merklePatriciaProofAddress;
        shared.auxiliary.addresses.MessageBus = messageBusAddress;
        shared.auxiliary.addresses.GatewayLib = gatewayLibAddress;
      },
    );
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
        shared.origin.addresses.MerklePatriciaProof = addressMerklePatriciaProof;
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
        shared.origin.addresses.MessageBus = addressMessageBus;
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
        shared.origin.addresses.GatewayLib = addressGatewayLib;
      })
      .then(() => {
        assert.isTrue(
          Web3.utils.isAddress(addressGatewayLib),
          'GatewayLib contract was not deployed correctly.',
        );
      });
  });
});
