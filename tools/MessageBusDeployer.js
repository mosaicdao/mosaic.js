'use strict';

const fs = require('fs'),
  Web3 = require('web3'),
  shell = require('shelljs');

const DeployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const passPhrase = 'testtest';

const MessageBusDeployer = function(config, configOutputPath) {
  const oThis = this;

  oThis.config = config;
  //Temp Code. ToDo: Assign oThis.config & use oThis.config object instead of configFileContent.
  oThis.configJsonFilePath = configOutputPath;
};

MessageBusDeployer.prototype = {
  perform: async function() {
    let oThis = this;

    oThis.configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));
    let deployerAddress = oThis.configFileContent.auxiliaryDeployerAddress,
      auxiliaryWeb3 = new Web3(oThis.configFileContent.auxiliaryGethRpcEndPoint),
      gasLimit = oThis.configFileContent.auxiliaryGasLimit;

    let auxiliaryMessageBusAddress = await this.deployMessageBus(auxiliaryWeb3, deployerAddress, gasLimit);

    let originWeb3 = new Web3(oThis.configFileContent.originGethRpcEndPoint);
    deployerAddress = oThis.configFileContent.originDeployerAddress;
    gasLimit = oThis.configFileContent.originGasLimit;

    let originMessageBusAddress = await this.deployMessageBus(originWeb3, deployerAddress, gasLimit);

    oThis._addConfig({ originMessageBusContractAddress: originMessageBusAddress });
    oThis._addConfig({ auxiliaryMessageBusContractAddress: auxiliaryMessageBusAddress });
  },

  deployMessageBus: async function(web3, deployerAddress, gasLimit) {
    const oThis = this;

    console.log('Deploy Message bus contract on value chain START.');

    await web3.eth.personal.unlockAccount(deployerAddress, passPhrase);

    let contractName = 'MessageBus',
      args = [];

    let messageBusDeployResponse = await new DeployContract({
      web3: web3,
      contractName: contractName,
      deployerAddress: deployerAddress,
      gasPrice: '0x0',
      gas: gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: args
    }).deploy();

    oThis.originMessageBusContractAddress = messageBusDeployResponse.receipt.contractAddress;
    console.log('originMessageBusContractAddress', oThis.originMessageBusContractAddress);

    return messageBusDeployResponse.receipt.contractAddress;
  },

  _addConfig: function(params) {
    const oThis = this;

    let config = oThis.config;
    Object.assign(config, params);

    oThis._executeInShell("echo '" + JSON.stringify(config, null, 2) + "' > " + oThis.configJsonFilePath);
  },

  _executeInShell: function(cmd) {
    let res = shell.exec(cmd);

    if (res.code !== 0) {
      shell.exit(1);
    }

    return res;
  }
};

module.exports = MessageBusDeployer;
