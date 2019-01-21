'use strict';

const rootPrefix = '../..',
  utils = require(rootPrefix + '/lib/setup/utils');

const deployContract = async function(abi, bin, web3, deployerAddress, gasPrice, args) {
  let txOptions = {
    from: deployerAddress,
    gas: 4700000,
    data: '0x' + binCode,
    gasPrice: gasPrice // taken from http://ethgasstation.info/ ---- 1 gwei
  };

  if (args) {
    txOptions.arguments = args;
  }

  const contract = new web3.eth.Contract(abi, null, txOptions);

  let tx = contract.deploy(txOptions),
    transactionHash = null,
    receipt = null;

  console.log('Deploying contract');

  const instance = await tx
    .signAndSend()
    .on('receipt', function(value) {
      receipt = value;
    })
    .on('transactionHash', function(value) {
      console.log('transaction hash: ' + value);
      transactionHash = value;
    })
    .on('error', function(error) {
      return Promise.reject(error);
    });

  const code = await web3.eth.getCode(instance.options.address);

  if (code.length <= 2) {
    return Promise.reject('Contract deployment failed. web3.eth.getCode returned empty code.');
  }

  console.log('Address  : ' + instance.options.address);
  console.log('Gas used : ' + receipt.gasUsed);

  return Promise.resolve({
    receipt: receipt,
    instance: instance
  });
};

const deployContractWithName = function(contractName, web3, deployerAddress, gasPrice, args) {
  let abi = utils.getABI(contractName),
    binCode = utils.getBIN(contractName);

  return deployContract(abi, binCode, web3, deployerAddress, gasPrice, args);
};

const Deployer = function() {};

Deployer.prototype = {
  deploy: async function(abi, bin, web3, deployerAddress, gasPrice, args) {
    return await deployContract(abi, binCode, web3, deployerAddress, gasPrice, args);
  },

  deployWithName: async function(contractName, web3, deployerAddress, gasPrice, args) {
    return await deployContractWithName(contractName, web3, deployerAddress, gasPrice, args);
  }
};

module.exports = new Deployer();
