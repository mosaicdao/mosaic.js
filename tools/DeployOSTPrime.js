'use strict';

const fs = require('fs'),
  os = require('os'),
  Web3 = require('web3');

const DeployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const auxiliaryPassphrase = 'testtest';

const DeployOSTPrime = function(params) {
  const oThis = this;

  oThis.configJsonFilePath = os.homedir() + '/mosaic-setup' + '/config.json';
};

DeployOSTPrime.prototype = {
  perform: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let auxiliaryWeb3 = new Web3(configFileContent.auxiliaryGethRpcEndPoint);

    console.log('Deploy OSTPrime contract on auxiliary chain START.');

    await auxiliaryWeb3.eth.personal.unlockAccount(configFileContent.auxiliaryDeployerAddress, auxiliaryPassphrase);

    let contractName = 'STPrime',
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
    console.log('STPrime ContractAddress :', oThis.stPrimeContractAddress);

    return stPrimeDeployResponse;
  }
};

module.exports = DeployOSTPrime;
