'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('../../libs/AbiBinProvider');
const OrganizationHelper = require('../../libs/helpers/OrganizationHelper');

const ContractName = 'SafeCore';

class SafeCoreHelper {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /*
    //Supported Configurations for setup
    {
  
    }
  */

  setup(config, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    if (!config) {
      throw new Error('Mandatory parameter "config" missing. ');
    }

    if (!config.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set config.deployer address');
    }

    if (!config.remoteChainId) {
      throw new Error('Mandatory configuration "remoteChainId" missing. Set config.remoteChainId.');
    }

    if (!config.organization) {
      throw new Error('Mandatory configuration "organization" missing. Set config.organization contract address.');
    }

    if (config.coCoreAddress && !config.organizationOwner) {
      throw new Error(
        'Mandatory configuration "organizationOwner" missing. Set config.organizationOwner address. organizationOwner is mandatory when using coCoreAddress config option'
      );
    }

    if (!txOptions) {
      txOptions = txOptions || {};
    }

    if (typeof txOptions.gasPrice === 'undefined') {
      txOptions.gasPrice = '0x5B9ACA00';
    }

    let deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;

    //1. Get block and stateRoot.
    let blockHeight = config.blockHeight || 'latest';
    let stateRoot;
    console.log('* Fetching Block:', blockHeight);
    let promiseChain = web3.eth.getBlock(blockHeight).then(function(block) {
      blockHeight = block.number;
      stateRoot = block.stateRoot;
    });

    //2. Deploy the Contract
    promiseChain = promiseChain.then(function() {
      return oThis.deploy(config.remoteChainId, blockHeight, stateRoot, config.organization, deployParams);
    });

    //3. Set coCoreAddress.
    if (config.coCoreAddress) {
      promiseChain = promiseChain.then(function() {
        let ownerParams = Object.assign({}, deployParams);
        ownerParams.from = config.organizationOwner;
        return oThis.setCoCoreAddress(config.coCoreAddress, ownerParams);
      });
    }

    return promiseChain;
  }

  deploy(_remoteChainId, _blockHeight, _stateRoot, _membersManager, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let defaultOptions = {
      gas: '1000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    let args = [_remoteChainId, _blockHeight, _stateRoot, _membersManager];
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

  setCoCoreAddress(coCoreAddress, txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;

    let defaultOptions = {
      gas: 61000
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    let tx = contract.methods.setCoCoreAddress(coCoreAddress);

    console.log(`* Setting ${ContractName} Co-Core Address`);
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

module.exports = SafeCoreHelper;
