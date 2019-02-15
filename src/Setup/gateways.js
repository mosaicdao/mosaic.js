'use strict';

const EIP20Gateway = require('../ContractInteract/EIP20Gateway');
const GatewayLib = require('../ContractInteract/GatewayLib');
const MerklePatriciaProof = require('../ContractInteract/MerklePatriciaProof');
const MessageBus = require('../ContractInteract/MessageBus');

const deployMerklePatriciaProofs = (
  originWeb3,
  auxiliaryWeb3,
  originTxOptions,
  auxiliaryTxOptions,
) => {
  const deployment = Promise.all([
    MerklePatriciaProof.deploy(originWeb3, originTxOptions),
    MerklePatriciaProof.deploy(auxiliaryWeb3, auxiliaryTxOptions),
  ]);

  return deployment;
};

const deployGatewayLibraries = (
  originWeb3,
  auxiliaryWeb3,
  originMerklePatriciaProof,
  auxiliaryMerklePatriciaProof,
  originTxOptions,
  auxiliaryTxOptions,
) => {
  const deployment = Promise.all([
    GatewayLib.deploy(
      originWeb3,
      originMerklePatriciaProof.address,
      originTxOptions,
    ),
    GatewayLib.deploy(
      auxiliaryWeb3,
      auxiliaryMerklePatriciaProof.address,
      auxiliaryTxOptions,
    ),
    MessageBus.deploy(
      originWeb3,
      originMerklePatriciaProof.address,
      originTxOptions,
    ),
    MessageBus.deploy(
      auxiliaryWeb3,
      auxiliaryMerklePatriciaProof.address,
      auxiliaryTxOptions,
    ),
  ]);

  return deployment;
};

const deployGateways = (
  originWeb3,
  auxiliaryWeb3,
  originSetupConfig,
  auxiliarySetupConfig,
  originTxOptions,
  auxiliaryTxOptions,
) => {
  const deployment = EIP20Gateway.setupPair(
    originWeb3,
    auxiliaryWeb3,
    originSetupConfig,
    auxiliarySetupConfig,
    originTxOptions,
    auxiliaryTxOptions,
  );

  return deployment;
};

const setup = (
  originWeb3,
  auxiliaryWeb3,
  originGatewayConfig,
  auxiliaryGatewayConfig,
  originTxOptions,
  auxiliaryTxOptions,
) => {
  const originSetupConfig = originGatewayConfig;
  const auxiliarySetupConfig = auxiliaryGatewayConfig;

  const deployedMerklePatriciaProofs = deployMerklePatriciaProofs(
    originWeb3,
    auxiliaryWeb3,
    {
      from: originSetupConfig.deployer,
      ...originTxOptions,
    },
    {
      from: auxiliarySetupConfig.deployer,
      ...auxiliaryTxOptions,
    },
  );

  const deployedGatewayLibraries = deployedMerklePatriciaProofs.then(
    ([originMerklePatriciaProof, auxiliaryMerklePatriciaProof]) => {
      const libraries = deployGatewayLibraries(
        originWeb3,
        auxiliaryWeb3,
        originMerklePatriciaProof,
        auxiliaryMerklePatriciaProof,
        {
          from: originSetupConfig.deployer,
          ...originTxOptions,
        },
        {
          from: auxiliarySetupConfig.deployer,
          ...auxiliaryTxOptions,
        },
      );

      return libraries;
    },
  );

  const deployedGateways = deployedGatewayLibraries.then(
    ([
      originGatewayLib,
      auxiliaryGatewayLib,
      originMessageBus,
      auxiliaryMessageBus,
    ]) => {
      originSetupConfig.messageBus = originMessageBus.address;
      originSetupConfig.gatewayLib = originGatewayLib.address;
      auxiliarySetupConfig.messageBus = auxiliaryMessageBus.address;
      auxiliarySetupConfig.gatewayLib = auxiliaryGatewayLib.address;

      return deployGateways(
        originWeb3,
        auxiliaryWeb3,
        originSetupConfig,
        auxiliarySetupConfig,
        originTxOptions,
        auxiliaryTxOptions,
      );
    },
  );

  return deployedGateways.then(
    // Waiting for the origin gateway activation to finish, but dropping it from the result set.
    (gateways) => [gateways.EIP20Gateway, gateways.EIP20CoGateway],
  );
};

module.exports = setup;
