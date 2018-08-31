'use strict';

const fs = require('fs'),
  os = require('os'),
  Web3 = require('web3'),
  shell = require('shelljs');

const DeployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const auxiliaryPassphrase = 'testtest';

const OSTPrimeDeployer = function(params) {
  const oThis = this;

  oThis.configJsonFilePath = os.homedir() + '/mosaic-setup' + '/config.json';
};

OSTPrimeDeployer.prototype = {
  perform: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let auxiliaryWeb3 = new Web3(configFileContent.auxiliaryGethRpcEndPoint);

    console.log('Deploy OSTPrime contract on auxiliary chain START.');

    await auxiliaryWeb3.eth.personal.unlockAccount(configFileContent.auxiliaryDeployerAddress, auxiliaryPassphrase);

    let contractName = 'OSTPrime',
      args = [configFileContent.erc20TokenContractAddress, 1, 0];

    let stPrimeDeployResponse = await new DeployContract({
      web3: auxiliaryWeb3,
      contractName: contractName,
      deployerAddress: configFileContent.auxiliaryDeployerAddress,
      gasPrice: '0x0',
      gas: configFileContent.auxiliaryGasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: args
    }).deploy();

    oThis.stPrimeContractAddress = stPrimeDeployResponse.receipt.contractAddress;
    console.log('OSTPrime ContractAddress :', oThis.stPrimeContractAddress);
    oThis._addConfig({ stPrimeContractAddress: oThis.stPrimeContractAddress });
    return stPrimeDeployResponse;
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

module.exports = OSTPrimeDeployer;
