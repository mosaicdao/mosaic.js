'use strict';

const fs = require('fs'),
  Web3 = require('web3'),
  shell = require('shelljs'),
  os = require('os');

const deployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const originPassphrase = 'testtest',
  auxiliaryPassphrase = 'testtest';

const InitCore = function() {
  const oThis = this;

  oThis.originWorkerContractAddress = null;
  oThis.auxiliaryWorkerContractAddress = null;

  oThis.configJsonFilePath = os.homedir() + '/mosaic-setup' + '/config.json';
};

InitCore.prototype = {
  perform: async function() {
    const oThis = this;

    oThis._initVars();

    await oThis._deployWorkerOnAuxiliary();

    let auxiliaryCoreContract = await oThis._deployCoreOnAuxiliary();

    await oThis._deployWorkerOnOrigin();

    let originCoreContract = await oThis._deployCoreOnOrigin();

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    await oThis._setCoCoreAddress(
      auxiliaryCoreContract.instance,
      originCoreContract.receipt.contractAddress,
      configFileContent.auxiliaryOpsAddress,
      oThis.auxiliaryWeb3,
      originPassphrase
    );

    await oThis._setCoCoreAddress(
      originCoreContract.instance,
      auxiliaryCoreContract.receipt.contractAddress,
      configFileContent.originOpsAddress,
      oThis.originWeb3,
      auxiliaryPassphrase
    );
  },

  _initVars: function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    oThis.auxiliaryWeb3 = new Web3(configFileContent.auxiliaryGethRpcEndPoint);
    oThis.originWeb3 = new Web3(configFileContent.originGethRpcEndPoint);
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
      gasPrice: '0x0',
      gas: configFileContent.auxiliaryGasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: []
    }).deploy();

    //console.log('auxiliaryWorkerContractDeployResponse:',
    // auxiliaryWorkerContractDeployResponse);

    let auxiliaryWorkerContract = auxiliaryWorkerContractDeployResponse.instance;

    oThis.auxiliaryWorkerContractAddress = auxiliaryWorkerContractDeployResponse.receipt.contractAddress;
    oThis._addConfig({ auxiliaryWorkerContractAddress: oThis.auxiliaryWorkerContractAddress });

    console.log('setOpsAddress on auxiliary chain Workers START.');

    let setOpsAddressForAuxiliaryWorkersResponse = await auxiliaryWorkerContract.methods
      .setOpsAddress(configFileContent.auxiliaryOpsAddress)
      .send({
        from: configFileContent.auxiliaryDeployerAddress,
        gasPrice: '0x0'
      });

    /*
        console.log(
          'setOpsAddress on auxiliary chain Workers receipt:',
          JSON.stringify(setOpsAddressForAuxiliaryWorkersResponse, null, 4)
        );
    */

    await oThis.auxiliaryWeb3.eth.personal.unlockAccount(configFileContent.auxiliaryOpsAddress, auxiliaryPassphrase);

    console.log('setWorker on auxiliary chain Workers START.');

    let deactivationHeight = '10000000000000000000000000000000000';
    let setWorkerForAuxiliaryWorkersResponse = await auxiliaryWorkerContract.methods
      .setWorker(configFileContent.auxiliaryWorkerAddress, deactivationHeight)
      .send({
        from: configFileContent.auxiliaryOpsAddress,
        gasPrice: '0x0'
      });

    /*console.log(
      'setWorker on auxiliary chain Workers receipt:',
      JSON.stringify(setWorkerForAuxiliaryWorkersResponse, null, 4)
    );*/
  },

  _deployCoreOnAuxiliary: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    // getting the latest block information from auxiliary GETH
    let latestBlock = await oThis.auxiliaryWeb3.eth.getBlock('latest');

    // extracting block number and state root from the block info
    let blockHeight = latestBlock.number,
      stateRoot = latestBlock.stateRoot;

    console.log('Deploy core contract on auxiliary chain START.');

    await oThis.auxiliaryWeb3.eth.personal.unlockAccount(
      configFileContent.auxiliaryDeployerAddress,
      auxiliaryPassphrase
    );

    let coreDeployParams = [
      configFileContent.auxiliaryChainId,
      configFileContent.originChainId,
      blockHeight,
      stateRoot,
      oThis.auxiliaryWorkerContractAddress
    ];

    let contractName = 'Core';

    let auxiliaryCoreDeployResponse = await new deployContract({
      web3: oThis.auxiliaryWeb3,
      contractName: contractName,
      deployerAddress: configFileContent.auxiliaryDeployerAddress,
      gasPrice: '0x0',
      gas: configFileContent.auxiliaryGasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: coreDeployParams
    }).deploy();

    //console.log('auxiliaryCoreDeployResponse:', auxiliaryCoreDeployResponse);

    let auxiliaryCoreContractAddress = auxiliaryCoreDeployResponse.receipt.contractAddress;

    console.log('auxiliaryCoreContractAddress', auxiliaryCoreContractAddress);
    oThis._addConfig({ auxiliaryCoreContractAddress: auxiliaryCoreContractAddress });

    return auxiliaryCoreDeployResponse;
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
      gasPrice: '0x0',
      gas: configFileContent.originGasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: []
    }).deploy();

    //console.log('originWorkerContractDeployResponse:',
    // originWorkerContractDeployResponse);

    let originWorkerContract = originWorkerContractDeployResponse.instance;

    oThis.originWorkerContractAddress = originWorkerContractDeployResponse.receipt.contractAddress;
    oThis._addConfig({ originWorkerContractAddress: oThis.originWorkerContractAddress });

    console.log('setOpsAddress on origin chain Workers START.');

    let setOpsAddressForOriginWorkersResponse = await originWorkerContract.methods
      .setOpsAddress(configFileContent.originOpsAddress)
      .send({
        from: configFileContent.originDeployerAddress,
        gasPrice: '0x0'
      });

    /*console.log(
      'setOpsAddress on origin chain Workers receipt:',
      JSON.stringify(setOpsAddressForOriginWorkersResponse, null, 4)
    );*/

    await oThis.originWeb3.eth.personal.unlockAccount(configFileContent.originOpsAddress, originPassphrase);

    console.log('setWorker on origin chain Workers START.');

    let deactivationHeight = '10000000000000000000000000000000000';
    let setWorkerForOriginWorkersResponse = await originWorkerContract.methods
      .setWorker(configFileContent.originWorkerAddress, deactivationHeight)
      .send({
        from: configFileContent.originOpsAddress,
        gasPrice: '0x0'
      });

    /*   console.log(
         'setWorker on origin chain Workers receipt:',
         JSON.stringify(setWorkerForOriginWorkersResponse, null, 4)
       );*/
  },

  _deployCoreOnOrigin: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    // getting the latest block information from origin GETH
    let latestBlock = await oThis.originWeb3.eth.getBlock('latest');

    // extracting block number and state root from the block info
    let blockHeight = latestBlock.number,
      stateRoot = latestBlock.stateRoot;

    console.log('Deploy core contract on origin chain START.');

    await oThis.originWeb3.eth.personal.unlockAccount(configFileContent.originDeployerAddress, originPassphrase);

    let coreDeployParams = [
      configFileContent.originChainId,
      configFileContent.auxiliaryChainId,
      blockHeight,
      stateRoot,
      oThis.originWorkerContractAddress
    ];

    let contractName = 'Core';

    let originCoreDeployResponse = await new deployContract({
      web3: oThis.originWeb3,
      contractName: contractName,
      deployerAddress: configFileContent.originDeployerAddress,
      gasPrice: '0x0',
      gas: configFileContent.originGasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: coreDeployParams
    }).deploy();

    //console.log('originCoreDeployResponse:', originCoreDeployResponse);

    let originCoreContractAddress = originCoreDeployResponse.receipt.contractAddress;

    console.log('originCoreContractAddress', originCoreContractAddress);
    oThis._addConfig({ originCoreContractAddress: originCoreContractAddress });

    return originCoreDeployResponse;
  },

  _setCoCoreAddress: async function(coreInstance, coCoreAddress, workerAddress, web3, passPhrase) {
    let oThis = this;

    console.log('setting co-core address ', coCoreAddress);
    await web3.eth.personal.unlockAccount(workerAddress, passPhrase);

    await coreInstance.methods.setCoCoreAddress(coCoreAddress).send({
      from: workerAddress,
      gasPrice: oThis.gasPrice
    });
  },

  _addConfig: function(params) {
    const oThis = this;

    let fileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    for (var i in params) {
      fileContent[i] = params[i];
    }

    oThis._executeInShell("echo '" + JSON.stringify(fileContent) + "' > " + oThis.configJsonFilePath);
  },

  _executeInShell: function(cmd) {
    let res = shell.exec(cmd);

    if (res.code !== 0) {
      shell.exit(1);
    }

    return res;
  }
};

module.exports = InitCore;
