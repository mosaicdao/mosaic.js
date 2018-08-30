'use strict';

const fs = require('fs'),
  Web3 = require('web3'),
  shell = require('shelljs'),
  os = require('os');

const deployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const originPassphrase = 'testtest',
  auxiliaryPassphrase = 'testtest';

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
 *    openSTRemote: '0x000...',
 *    gasPrice: '',
 *    gasLimit: ''
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
 *    openSTRemote: '0x000...',
 *    gasPrice: '',
 *    gasLimit: ''
 * }
 *
 */
const InitCore = function(originConfig, auxliaryConfig) {
  const oThis = this;

  oThis.originConfig = originConfig;
  oThis.auxliaryConfig = auxliaryConfig;

  oThis.valueWorkerContractAddress = null;
  oThis.auxiliaryWorkerContractAddress = null;

  oThis.configJsonFilePath = os.homedir() + '/mosaic-setup' + '/config.json';
};

InitCore.prototype = {
  perform: async function() {
    const oThis = this;

    oThis._initVars();

    await oThis._deployWorkerOnAuxiliary();

    let auxiliaryCoreContract = await oThis.deployCoreOnAuxiliary();

    await oThis._deployWorkerOnOrigin();

    let originCoreContract = await oThis.deployCoreOnOrigin();

    await oThis.setCoCoreAddress(
      auxiliaryCoreContract.instance,
      originCoreContract.receipt.contractAddress,
      oThis.auxliaryConfig.opsAddress,
      'testtest',
      auxiliaryWeb3
    );

    await oThis.setCoCoreAddress(
      originCoreContract.instance,
      auxiliaryCoreContract.receipt.contractAddress,
      oThis.originConfig.opsAddress,
      'testtest',
      valueWeb3
    );
  },

  _initVars: function() {
    const oThis = this;

    oThis.auxiliaryWeb3 = new Web3(oThis.auxliaryConfig.provider);
    oThis.valueWeb3 = new Web3(oThis.originConfig.provider);
  },

  _deployWorkerOnAuxiliary: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    console.log('Deploy worker contract on auxiliary chain START.');

    await oThis.auxiliaryWeb3.eth.personal.unlockAccount(
      configFileContent.auxiliaryDeployerAddress,
      auxiliaryPassphrase
    );

    let contractName = 'Workers';

    let auxiliaryWorkerContractDeployResponse = await new deployContract({
      web3: oThis.auxiliaryWeb3,
      contractName: contractName,
      deployerAddress: configFileContent.auxiliaryDeployerAddress,
      gasPrice: oThis.auxliaryConfig.gasPrice,
      gas: oThis.auxliaryConfig.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: ['0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca'] // DUMMY - remove this @sarvesh
    }).deploy();

    console.log('auxiliaryWorkerContractDeployResponse:', auxiliaryWorkerContractDeployResponse);

    let auxiliaryWorkerContract = auxiliaryWorkerContractDeployResponse.instance;

    oThis.auxiliaryWorkerContractAddress = auxiliaryWorkerContractDeployResponse.receipt.contractAddress;
    oThis._addConfig({ auxiliaryWorkerContractAddress: auxiliaryWorkerContractAddress });

    console.log('setOpsAddress on auxiliary chain Workers START.');

    let setOpsAddressForAuxiliaryWorkersResponse = await auxiliaryWorkerContract.methods
      .setOpsAddress(configFileContent.auxiliaryOpsAddress)
      .send({
        from: configFileContent.auxiliaryDeployerAddress,
        gasPrice: oThis.auxliaryConfig.gasPrice
      });

    console.log(
      'setOpsAddress on auxiliary chain Workers receipt:',
      JSON.stringify(setOpsAddressForAuxiliaryWorkersResponse, null, 4)
    );

    await oThis.auxiliaryWeb3.eth.personal.unlockAccount(configFileContent.auxiliaryOpsAddress, auxiliaryPassphrase);

    console.log('setWorker on auxiliary chain Workers START.');

    let deactivationHeight = '10000000000000000000000000000000000';
    let setWorkerForAuxiliaryWorkersResponse = await auxiliaryWorkerContract.methods
      .setWorker(configFileContent.auxiliaryWorkerAddress, deactivationHeight)
      .send({
        from: configFileContent.auxiliaryOpsAddress,
        gasPrice: oThis.auxliaryConfig.gasPrice
      });

    console.log(
      'setWorker on auxiliary chain Workers receipt:',
      JSON.stringify(setWorkerForAuxiliaryWorkersResponse, null, 4)
    );
  },

  _deployWorkerOnOrigin: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    console.log('Deploy worker contract on origin chain START.');

    await oThis.originWeb3.eth.personal.unlockAccount(configFileContent.originDeployerAddress, originPassphrase);

    let contractName = 'Workers';

    let originWorkerContractDeployResponse = await new deployContract({
      web3: oThis.originWeb3,
      contractName: contractName,
      deployerAddress: configFileContent.originDeployerAddress,
      gasPrice: oThis.auxliaryConfig.gasPrice,
      gas: oThis.auxliaryConfig.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: ['0x2c4e8f2d746113d0696ce89b35f0d8bf88e0aeca'] // DUMMY - remove this @sarvesh
    }).deploy();

    console.log('originWorkerContractDeployResponse:', originWorkerContractDeployResponse);

    let originWorkerContract = originWorkerContractDeployResponse.instance;

    oThis.originWorkerContractAddress = originWorkerContractDeployResponse.receipt.contractAddress;
    oThis._addConfig({ originWorkerContractAddress: originWorkerContractAddress });

    console.log('setOpsAddress on origin chain Workers START.');

    let setOpsAddressForOriginWorkersResponse = await originWorkerContract.methods
      .setOpsAddress(configFileContent.originOpsAddress)
      .send({
        from: configFileContent.originDeployerAddress,
        gasPrice: oThis.auxliaryConfig.gasPrice
      });

    console.log(
      'setOpsAddress on origin chain Workers receipt:',
      JSON.stringify(setOpsAddressForOriginWorkersResponse, null, 4)
    );

    await oThis.originWeb3.eth.personal.unlockAccount(configFileContent.originOpsAddress, originPassphrase);

    console.log('setWorker on origin chain Workers START.');

    let deactivationHeight = '10000000000000000000000000000000000';
    let setWorkerForOriginWorkersResponse = await originWorkerContract.methods
      .setWorker(configFileContent.originWorkerAddress, deactivationHeight)
      .send({
        from: configFileContent.originOpsAddress,
        gasPrice: oThis.auxliaryConfig.gasPrice
      });

    console.log(
      'setWorker on origin chain Workers receipt:',
      JSON.stringify(setWorkerForOriginWorkersResponse, null, 4)
    );
  },

  _addConfig: function(params) {
    const oThis = this;

    let fileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    for (var i in params) {
      fileContent[i] = params[i];
    }

    oThis._handleShellResponse(shell.exec("echo '" + JSON.stringify(fileContent) + "' > " + oThis.configJsonFilePath));
  },

  deployCoreOnOrigin: async function() {
    const oThis = this;

    let valueWeb3 = new (oThis.ic().OriginWeb3())();

    let latestBlock = await valueWeb3.eth.getBlock('latest');

    let blockHeight = latestBlock.number,
      stateRoot = latestBlock.stateRoot;

    console.log('Deploy core contract on origin chain START.');

    await valueWeb3.eth.personal.unlockAccount(oThis.originConfig.deployerAddress, 'testtest');

    let coreDeployParams = [
      oThis.originConfig.chainId,
      oThis.originConfig.chainIdRemote,
      blockHeight,
      stateRoot,
      oThis.valueWorkerContractAddress
    ];

    let valueCoreDeployResponse = await deployContract(
      valueWeb3,
      'Core',
      oThis.originConfig.deployerAddress,
      oThis.gasPrice,
      coreDeployParams
    );

    console.log('valueCoreDeployResponse:', valueCoreDeployResponse);

    return valueCoreDeployResponse;
  },

  deployCoreOnAuxiliary: async function() {
    const oThis = this;

    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())('0x0000000000000000000000000000000000000001');

    let latestBlock = await auxiliaryWeb3.eth.getBlock('latest');

    let blockHeight = latestBlock.number,
      stateRoot = latestBlock.stateRoot;

    console.log('Deploy core contract on auxiliary chain START.');

    await auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxliaryConfig.deployerAddress, 'testtest');

    let coreDeployParams = [
      oThis.auxliaryConfig.chainId,
      oThis.auxliaryConfig.chainIdRemote,
      blockHeight,
      stateRoot,
      oThis.auxiliaryWorkerContractAddress
    ];

    let auxiliaryCoreDeployResponse = await deployContract(
      auxiliaryWeb3,
      'Core',
      oThis.auxliaryConfig.deployerAddress,
      oThis.gasPrice,
      coreDeployParams
    );

    console.log('auxiliaryCoreDeployResponse:', auxiliaryCoreDeployResponse);

    let auxiliaryCoreContract = auxiliaryCoreDeployResponse.instance,
      auxiliaryCoreContractAddress = auxiliaryCoreDeployResponse.receipt.contractAddress;

    console.log('auxiliaryCoreContractAddress', auxiliaryCoreContractAddress);

    return auxiliaryCoreDeployResponse;
  },

  setCoCoreAddress: async function(coreInstance, coCoreAddress, workerAddress, passPhrase, web3) {
    let oThis = this;
    console.log('setting co-core address ', coCoreAddress);
    await web3.eth.personal.unlockAccount(workerAddress, passPhrase);

    await coreInstance.methods.setCoCoreAddress(coCoreAddress).send({
      from: workerAddress,
      gasPrice: oThis.gasPrice
    });
  }
};

InstanceComposer.registerShadowableClass(InitCore, 'InitCore');

module.exports = InitCore;
