'use strict';

const linker = require('solc/linker');

const InstanceComposer = require('../../instance_composer'),
  DeployContract = require('../../utils/deployContract'),
  helper = require('../../utils/helper');

const GATEWAY_NAME = 'Gateway',
  CO_GATEWAY_NAME = 'CoGateway',
  MESSAGE_BUS_NAME = 'MessageBus';

/*
originConfig: {
    coreAddress: coreAddress,
    deployerAddress: deployerAddress,
    deployerPassPhrase:passphrase,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    token: valueTokenAddress,
    bounty: 100,
    organisationAddress: organisationAddress,
    messageBusAddress: messageBusAddress
},

auxiliaryConfig: {
    coreAddress: coreAddress,
    deployerAddress: deployerAddress,
    deployerPassPhrase:passphrase,
    coreContractAddress:coreContractAddress,
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    token: utilityTokenAddress,
    bounty: 100,
    organisationAddress: organisationAddress,
    messageBusAddress: messageBusAddress
}
*/

const GatewayDeployer = function(originConfig, auxiliaryConfig) {
  const oThis = this;

  oThis._originConfig = originConfig;
  oThis._auxiliaryConfig = auxiliaryConfig;
  let OriginWeb3 = oThis.ic().OriginWeb3();
  let AuxiliaryWeb3 = oThis.ic().AuxiliaryWeb3();
  oThis.originWeb3 = new OriginWeb3();
  oThis.auxiliaryWeb3 = new AuxiliaryWeb3(oThis._originConfig.coreAddress);
};

GatewayDeployer.prototype = {
  deploy: async function() {
    const oThis = this;

    let gateway = await oThis._deployGateway();
    let cogateway = await oThis._deployCoGateway();

    return { cogateway: cogateway, gateway: gateway };
  },
  _deployGateway: async function() {
    const oThis = this;

    console.log('Deploy gateway contract on value chain START.');

    // await oThis.originWeb3.eth.personal.unlockAccount(
    //   oThis._originConfig.deployerAddress,
    //   oThis._originConfig.deployerPassPhrase
    // );

    let linkedBin = await oThis.linkMessageBus(
      helper.getBIN(GATEWAY_NAME),
      MESSAGE_BUS_NAME,
      oThis._originConfig.messageBusAddress
    );
    let args = [
      oThis._originConfig.token,
      oThis._originConfig.coreAddress,
      0, //todo need to add bounty in config
      oThis._originConfig.organisationAddress
      // in setup script
    ];

    let receipt = await new DeployContract({
      web3: oThis.originWeb3,
      contractName: GATEWAY_NAME,
      deployerAddress: oThis._originConfig.deployerAddress,
      gasPrice: oThis._originConfig.gasPrice,
      gas: oThis._originConfig.gasLimit,
      abi: helper.getABI(GATEWAY_NAME),
      bin: linkedBin,
      args: args
    }).deploy();
    oThis.gatewayContractAddress = receipt.receipt.contractAddress;

    return receipt;
  },
  _deployCoGateway: async function() {
    const oThis = this;

    //let configFileContent =
    // JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    console.log('Deploy co-gateway contract on value chain START.');
    //
    // await oThis.auxiliaryWeb3.eth.personal.unlockAccount(
    //   oThis._auxiliaryConfig.deployerAddress,
    //   oThis._auxiliaryConfig.deployerPassPhrase
    // );

    let args = [
      oThis._auxiliaryConfig.token,
      oThis._auxiliaryConfig.coreAddress,
      0, //todo need to add bounty in config
      oThis._auxiliaryConfig.organisationAddress,
      oThis.gatewayContractAddress
    ];

    let linkedBin = await oThis.linkMessageBus(
      helper.getBIN(CO_GATEWAY_NAME),
      MESSAGE_BUS_NAME,
      oThis._auxiliaryConfig.messageBusAddress
    );

    let auxiliaryCoGatewayContractDeployResponse = await new DeployContract({
      web3: oThis.auxiliaryWeb3,
      contractName: CO_GATEWAY_NAME,
      deployerAddress: oThis._auxiliaryConfig.deployerAddress,
      gasPrice: oThis._auxiliaryConfig.gasPrice,
      gas: oThis._auxiliaryConfig.gasLimit,
      abi: helper.getABI(CO_GATEWAY_NAME),
      bin: linkedBin,
      args: args
    }).deploy();

    oThis.coGatewayContractAddress = auxiliaryCoGatewayContractDeployResponse.receipt.contractAddress;

    return auxiliaryCoGatewayContractDeployResponse;
  },

  linkMessageBus: async function(bin, libraryName, libAddress) {
    let linkOptions = {};
    linkOptions[libraryName] = libAddress;

    return linker.linkBytecode(bin, linkOptions);
  }
};

InstanceComposer.registerShadowableClass(GatewayDeployer, 'GatewayDeployer');

module.exports = GatewayDeployer;
