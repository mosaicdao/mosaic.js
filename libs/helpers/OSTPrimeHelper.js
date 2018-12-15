'use strict';

const Web3 = require('web3');
const BN = require('bn.js');
const AbiBinProvider = require('../../libs/AbiBinProvider');

const ContractName = 'OSTPrime';

class OSTPrimeHelper {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /*
  //Supported Configurations for setup
  {
    deployer: config.deployerAddress,
    chainOwner: chainOwner,
    valueToken: config.simpleTokenContractAddress
  }
  Both deployer, chainOwner & valueToken are mandatory configurations.
*/

  setup(simpleToken, config, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    if (!simpleToken) {
      throw new Error('Mandatory configuration "simpleToken" missing. Provide SimpleToken contract address.');
    }

    OSTPrimeHelper.validateSetupConfig(config);

    if (!txOptions) {
      txOptions = txOptions || {};
    }
    txOptions.gasPrice = 0;

    let deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;
    deployParams.gasPrice = 0;

    //1. Deploy the Contract
    let promiseChain = oThis.deploy(simpleToken, deployParams);

    //2. Initialize.
    promiseChain = promiseChain.then(function() {
      let ownerParams = Object.assign({}, deployParams);
      ownerParams.from = config.chainOwner;
      return oThis.initialize(ownerParams);
    });

    return promiseChain;
  }

  static validateSetupConfig(config) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    if (!config.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set config.deployer address');
    }

    if (!config.chainOwner) {
      throw new Error('Mandatory configuration "chainOwner" missing. Set config.chainOwner.');
    }

    return true;
  }

  deploy(_valueToken, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let defaultOptions = {
      gas: '2500000',
      gasPrice: 0
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    let args = [_valueToken];
    const contract = new web3.eth.Contract(abi, null, txOptions);
    let tx = contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

    console.log(`* Deploying ${ContractName} Contract`);
    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .then(function(instace) {
        oThis.address = instace.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  initialize(txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;

    const valueToTransfer = Web3.utils.toWei('800000000');

    let defaultOptions = {
      gas: '60000',
      value: valueToTransfer,
      gasPrice: 0
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    let tx = contract.methods.initialize();

    console.log(`* Initializing ${ContractName}`);
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }
}

module.exports = OSTPrimeHelper;
