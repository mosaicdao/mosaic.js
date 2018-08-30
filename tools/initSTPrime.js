'use strict';

const deployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const InitSTPrime = function(params) {
  const oThis = this;

  oThis.web3Provider = params.web3Provider;
  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gasLimit = params.gasLimit;
  oThis.erc20TokenAddress = params.erc20TokenAddress;
};

InitSTPrime.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deploySTPrimeOnAuxiliary();
  },

  deploySTPrimeOnAuxiliary: async function() {
    const oThis = this;

    console.log('Deploy STPrime contract on auxiliary chain START.');

    await oThis.web3Provider.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);
    let contractName = 'STPrime',
      args = [oThis.erc20TokenAddress, 1, 0];
    let stPrimeDeployResponse = await new deployContract({
      web3: oThis.web3Provider,
      contractName: contractName,
      deployerAddress: oThis.deployerAddress,
      deployerPassphrase: oThis.deployerPassphrase,
      gasPrice: oThis.gasPrice,
      gas: oThis.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: args
    }).deploy();

    oThis.stPrimeContractAddress = stPrimeDeployResponse.receipt.contractAddress;
    console.log('STPrime ContractAddress :', oThis.stPrimeContractAddress);
    return stPrimeDeployResponse;
  }
};

module.exports = InitSTPrime;
