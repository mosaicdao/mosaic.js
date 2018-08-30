'use strict';

const linker = require('solc/linker');

const InstanceComposer = require('../../instance_composer'),
  deployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

const GATEWAY_NAME = 'Gateway',
  CO_GATEWAY_NAME = 'CoGateway',
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

    let coGatewayDeployResponse = await oThis.deployCoGatewayOnAuxiliary();

    let gatewayDeployResponse = await oThis.deployGatewayOnOrigin(coGatewayAddress);

    return { gateway: gatewayDeployResponse, cogateway: coGatewayDeployResponse };
  },

  deployCoGatewayOnAuxiliary: async function() {
    const oThis = this;

    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis._auxiliaryConfig.coreAddress);

    console.log('Deploy CoGateway on auxiliary chain START.');

    let abi = helper.getABI(CO_GATEWAY_NAME);
    let bin = oThis.linkMessageBus(CO_GATEWAY_NAME, MESSAGE_BUS_NAME, oThis._auxiliaryConfig.messageBusAddress);

    let args = [
      oThis._auxiliaryConfig.token,
      oThis._auxiliaryConfig.coreAddress,
      oThis._auxiliaryConfig.bounty,
      oThis._auxiliaryConfig.organisationAddress
    ];

    let coGatewayDeployResponse = await new deployContract({
      web3: auxiliaryWeb3,
      contractName: CO_GATEWAY_NAME,
      deployerAddress: oThis._auxiliaryConfig.deployerAddress,
      gasPrice: oThis._auxiliaryConfig.gasPrice,
      gas: oThis._auxiliaryConfig.gasLimit,
      abi: abi,
      bin: bin,
      args: args
    }).perform();

    return coGatewayDeployResponse.receipt.contractAddress;
  },

  deployGatewayOnOrigin: async function(coGatewayAddress) {
    const oThis = this;

    let valueWeb3 = new (oThis.ic().OriginWeb3())();

    console.log('Deploy Gateway on origin chain START.');

    let abi = helper.getABI(GATEWAY_NAME);
    let bin = oThis.linkMessageBus(GATEWAY_NAME, MESSAGE_BUS_NAME, oThis._originConfig.messageBusAddress);

    let args = [
      oThis._originConfig.token,
      coGatewayAddress,
      oThis._originConfig.coreAddress,
      oThis._originConfig.bounty,
      oThis._originConfig.organisationAddress
    ];

    let gatewayDeployResponse = await new deployContract({
      web3: valueWeb3,
      contractName: GATEWAY_NAME,
      deployerAddress: oThis._originConfig.deployerAddress,
      gasPrice: oThis._originConfig.gasPrice,
      gas: oThis._originConfig.gasLimit,
      abi: abi,
      bin: bin,
      args: args
    }).perform();

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
