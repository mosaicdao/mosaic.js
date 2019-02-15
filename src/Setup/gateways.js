/**
 * @typedef {Object} GatewaysOriginSetupConfig
 *
 * @property {string} token The address of the EIP20 token that you want to use for your economy.
 * @property {string} baseToken The address of the EIP20 token that is used as the base token on
 *                              auxiliary.
 * @property {string} stateRootProvider The address of a contract that provides state roots from the
 *                                      remote (auxiliary) chain.
 * @property {string} bounty The bounty is the amount that facilitators will earn for progressing
 *                           stake processes.
 * @property {string} organization The address of the organization contract on origin.
 * @property {string} burner The burner address is the address where burnt tokens will be
 *                           transferred to.
 * @property {string} deployer This address will be used as the `from` address when deploying.
 * @property {string} organizationOwner The address of the organization owner account on origin.
 */

/**
 * @typedef {Object} GatewaysAuxiliarySetupConfig
 *
 * @property {string} utilityToken The utility token wraps and unwraps base tokens of auxiliary to
 *                                 be transferred as EIP20tokens through the gateway.
 * @property {string} stateRootProvider The address of a contract that provides state roots from the
 *                                      remote (origin) chain.
 * @property {string} bounty The bounty is the amount that facilitators will earn for progressing
 *                           stake processes.
 * @property {string} organization The address of the organization contract on auxiliary.
 * @property {string} burner The burner address is the address where burnt tokens will be
 *                           transferred to.
 * @property {string} deployer The burner address is the address where burnt tokens will be
 *                           transferred to.
 * @property {string} organizationOwner The address of the organization owner account on auxiliary.
 */

'use strict';

const EIP20Gateway = require('../ContractInteract/EIP20Gateway');
const GatewayLib = require('../ContractInteract/GatewayLib');
const MerklePatriciaProof = require('../ContractInteract/MerklePatriciaProof');
const MessageBus = require('../ContractInteract/MessageBus');

/**
 * Deploys MerklePatriciaProof libraries on origin and auxiliary.
 *
 * @param {Web3} originWeb3 Web3 that points to origin.
 * @param {Web3} auxiliaryWeb3 Web3 that points to auxiliary.
 * @param {Object} originTxOptions Transaction options for the origin chain.
 * @param {Object} auxiliaryTxOptions Transaction options for the auxiliary chain.
 *
 * @returns {Promise<[MerklePatriciaProof, MerklePatriciaProof]>} Origin and auxiliary contracts.
 */
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

/**
 * Deploys GatewayLibs and MessageBuses on origin and auxiliary.
 *
 * @param {Web3} originWeb3 Web3 that points to origin.
 * @param {Web3} auxiliaryWeb3 Web3 that points to auxiliary.
 * @param {MerklePatriciaProof} originMerklePatriciaProof Proof library on origin.
 * @param {MerklePatriciaProof} auxiliaryMerklePatriciaProof Proof library on auxiliary.
 * @param {Object} originTxOptions Transaction options for the origin chain.
 * @param {Object} auxiliaryTxOptions Transaction options for the auxiliary chain.
 *
 * @returns {Promise<[GatewayLib, GatewayLib, MessageBus, MessageBus]>} Origin and auxiliary
 *                                                                      contracts.
 */
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

/**
 * Deploys and activates gateways on origin and auxiliary.
 *
 * @param {Web3} originWeb3 Web3 that points to origin.
 * @param {Web3} auxiliaryWeb3 Web3 that points to auxiliary.
 * @param {EIP20GatewaySetupConfig} originSetupConfig Gateway configuration.
 * @param {EIP20CoGatewaySetupConfig} auxiliarySetupConfig CoGateway configuration.
 * @param {Object} originTxOptions Transaction options for the origin chain.
 * @param {Object} auxiliaryTxOptions Transaction options for the auxiliary chain.
 *
 * @returns {Promise<Object>} Promise containing an object with two parameters: EIP20Gateway and
 *                            EIP20CoGateway.
 */
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

/**
 * Deploys all required libraries and the gateway and co-gateway.
 * It also activates the gateway.
 *
 * @param {Web3} originWeb3 Web3 that points to origin.
 * @param {Web3} auxiliaryWeb3 Web3 that points to auxiliary.
 * @param {GatewaysOriginSetupConfig} originGatewayConfig Configuration on origin.
 * @param {GatewaysAuxiliarySetupConfig} auxiliaryGatewayConfig Configuration on auxiliary.
 * @param {Object} originTxOptions Transaction options for the origin chain.
 * @param {Object} auxiliaryTxOptions Transaction options for the auxiliary chain.
 */
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

  auxiliarySetupConfig.valueToken = originSetupConfig.token;

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
