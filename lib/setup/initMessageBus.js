'use strict';

const InstanceComposer = require('../../instance_composer');

/**
 * originConfig = {
 *    provider: 'http://...',
 *    deployerAddress: '0xBAF68AC8e5966489B2b4139f07dE8188d8Ff5a99',
 *    opsAddress: '0xDCcfDAFF7aDDd20e5C64a3FE4b0B0668751EF194',
 *    workerAddress: '0x000...',
 *    registrar: '0x000...',
 *    chainId: 2001,
 *    chainIdRemote: 1000,
 *    remoteChainBlockGenerationTime: 15,
 *    openSTRemote: '0x000...'
 * }
 * auxliaryConfig = {
 *    provider: 'http://...',
 *    deployerAddress: '0x000...',
 *    opsAddress: '0x000...',
 *    workerAddress: '0x000...',
 *    registrar: '0x000...',
 *    chainId: 1000,
 *    chainIdRemote: 2001,
 *    remoteChainBlockGenerationTime: 15,
 *    openSTRemote: '0x000...'
 * }
 *
 */
const InitMessageBus = function(originConfig, auxliaryConfig) {
  const oThis = this;

  oThis.originConfig = originConfig;
  oThis.auxliaryConfig = auxliaryConfig;
};

InitMessageBus.prototype = {
  perform: async function() {
    const oThis = this;

    let messageBusOriginDeployResponse = await oThis.deployMessageBusOnOrigin();

    let messageBusAuxiliaryDeployResponse = await oThis.deployMessageBusOnAuxiliary();

    return { origin: messageBusOriginDeployResponse, auxiliary: messageBusAuxiliaryDeployResponse };
  },

  deployMessageBusOnOrigin: async function() {
    const oThis = this;

    let valueWeb3 = new (oThis.ic().OriginWeb3())();

    console.log('Deploy messageBus library on origin chain START.');

    await valueWeb3.eth.personal.unlockAccount(oThis.originConfig.deployerAddress, oThis.originConfig.deployerPass);

    let contractName = 'MessageBus',
      args = [];
    let valueMessageBusLibraryDeployResponse = await new deployContract({
      web3: valueWeb3,
      contractName: contractName,
      deployerAddress: oThis.originConfig.deployerAddress,
      gasPrice: oThis.originConfig.gasPrice,
      gas: oThis.originConfig.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: args
    }).perform();

    console.log('valueMessageBusLibraryAddress:', valueMessageBusLibraryDeployResponse.receipt.contractAddress);
    return valueMessageBusLibraryDeployResponse;
  },

  deployMessageBusOnAuxiliary: async function() {
    const oThis = this;

    //TODO: remove this hard coding.
    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())('0x0000000000000000000000000000000000000001');

    console.log('Deploy messageBus library on auxiliary chain START.');

    await auxiliaryWeb3.eth.personal.unlockAccount(
      oThis.auxliaryConfig.deployerAddress,
      oThis.auxliaryConfig.deployerPass
    );

    let contractName = 'MessageBus',
      args = [];
    let auxiliaryMessageBusLibraryDeployResponse = await new deployContract({
      web3: auxiliaryWeb3,
      contractName: contractName,
      deployerAddress: oThis.auxliaryConfig.deployerAddress,
      gasPrice: oThis.auxliaryConfig.gasPrice,
      gas: oThis.auxliaryConfig.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: args
    }).perform();

    console.log('auxiliaryMessageBusLibraryAddress:', auxiliaryMessageBusLibraryDeployResponse.receipt.contractAddress);
    return auxiliaryMessageBusLibraryDeployResponse;
  }
};

InstanceComposer.registerShadowableClass(InitMessageBus, 'InitMessageBus');

module.exports = InitMessageBus;
