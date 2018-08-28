'use strict';

const linker = require('solc/linker');

const rootPrefix = '../..',
  InstanceComposer = require('../../instance_composer'),
  utils = require(rootPrefix + '/lib/setup/utils'),
  deployer = require(rootPrefix + '/lib/setup/deployer');

const GATEWAY_NAME = 'GatewayV1',
  CO_GATEWAY_NAME = 'CoGatewayV1',
  MESSAGE_BUS_NAME = 'MessageBus';

/*
originConfig: {
    coreAddress: coreAddress,
    deployerAddress: deployerAddress,
    gasPrice: gasPrice,
    token: valueTokenAddress,
    bounty: 100,
    organisationAddress: organisationAddress,
    messageBusAddress: messageBusAddress
},

auxiliaryConfig: {
    coreAddress: coreAddress,
    deployerAddress: deployerAddress,
    gasPrice: gasPrice,
    token: utilityTokenAddress,
    bounty: 100,
    organisationAddress: organisationAddress,
    messageBusAddress: messageBusAddress
}
*/

const InitGateway = function(originConfig, auxiliaryConfig) {
  const oThis = this;

  oThis._originConfig = originConfig;
  oThis._auxiliaryConfig = auxiliaryConfig;
};

InitGateway.prototype = {
  perform: async function() {
    const oThis = this;

    let coGatewayAddress = await oThis.deployCoGatewayOnAuxiliary();

    let gatewayAddress = await oThis.deployGatewayOnOrigin(coGatewayAddress);

    return { gateway: gatewayAddress, cogateway: coGatewayAddress };
  },

  deployCoGatewayOnAuxiliary: async function() {
    const oThis = this;

    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis._auxiliaryConfig.coreAddress);

    console.log('Deploy CoGateway on auxiliary chain START.');

    let abi = utils.getABI(CO_GATEWAY_NAME);
    let bin = oThis.linkMessageBus(CO_GATEWAY_NAME, MESSAGE_BUS_NAME, oThis._auxiliaryConfig.messageBusAddress);

    let args = [
      oThis._auxiliaryConfig.token,
      oThis._auxiliaryConfig.coreAddress,
      oThis._auxiliaryConfig.bounty,
      oThis._auxiliaryConfig.organisationAddress
    ];

    let coGatewayDeployResponse = await deployer.deploy(
      abi,
      bin,
      auxiliaryWeb3,
      oThis._auxiliaryConfig.deployerAddress,
      oThis._auxiliaryConfig.gasPrice,
      args
    );

    return coGatewayDeployResponse.receipt.contractAddress;
  },

  deployGatewayOnOrigin: async function(coGatewayAddress) {
    const oThis = this;

    let valueWeb3 = new (oThis.ic().OriginWeb3())();

    console.log('Deploy Gateway on origin chain START.');

    let abi = utils.getABI(GATEWAY_NAME);
    let bin = oThis.linkMessageBus(GATEWAY_NAME, MESSAGE_BUS_NAME, oThis._originConfig.messageBusAddress);

    let args = [
      oThis._originConfig.token,
      coGatewayAddress,
      oThis._originConfig.coreAddress,
      oThis._originConfig.bounty,
      oThis._originConfig.organisationAddress
    ];

    let gatewayDeployResponse = await deployer.deploy(
      abi,
      bin,
      valueWeb3,
      oThis._originConfig.deployerAddress,
      oThis._originConfig.gasPrice,
      args
    );

    return gatewayDeployResponse.receipt.contractAddress;
  },

  linkMessageBus: async function(contractName, libraryName, libAddress) {
    const oThis = this;
    let bin = utils.getBIN(contractName);

    let linkOptions = {};
    linkOptions[libraryName] = libAddress;

    let bytecode = linker.linkBytecode(bin, linkOptions);

    return bytecode;
  }
};

InstanceComposer.registerShadowableClass(InitGateway, 'InitGateway');

module.exports = InitGateway;
