'use strict';

const deployContract = require('../utils/deployContract'),
  helper = require('../utils/helper');

const UtilityTokenDeployer = function(params) {
  const oThis = this;

  oThis.web3Provider = params.web3Provider;
  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gasLimit = params.gasLimit;
};

UtilityTokenDeployer.prototype = {
  perform: function() {
    const oThis = this;

    return oThis.deployUtilityTokenOnAuxiliary();
  },

  deployUtilityTokenOnAuxiliary: async function() {
    const oThis = this;

    console.log('Deploy UtilityToken contract on chain START.');

    await oThis.web3Provider.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);
    let contractName = 'MockUtilityToken',
      args = ['Mock Token', 'MOCK', 18];
    let tokenDeployResponse = await new deployContract({
      web3: oThis.web3Provider,
      contractName: contractName,
      deployerAddress: oThis.deployerAddress,
      gasPrice: oThis.gasPrice,
      gas: oThis.gasLimit,
      abi: helper.getABI(contractName),
      bin: helper.getBIN(contractName),
      args: args
    }).deploy();

    oThis.tokenContractAddress = tokenDeployResponse.receipt.contractAddress;
    console.log('UtilityToken ContractAddress :', oThis.tokenContractAddress);
    return tokenDeployResponse;
  }
};

module.exports = UtilityTokenDeployer;
