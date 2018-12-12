const Web3 = require('web3');
const AbiBinProvider = require('../../libs/AbiBinProvider');

const ContractName = 'Organization';
const WorkerExpirationHeight = 10000000;
class OrganizationHelper {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /*
  //Supported Configurations for setup
  config = {
    "deployer": config.deployerAddress,
    "owner": config.organizationOwner, 
    "admin": config.organizationAdmin, 
    "worker": config.organizationWorker,
    "workerExpirationHeight": 10000000, 
    "shouldCompleteOwnershipTransfer": true
  };
  //deployer and worker are mandetory.
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

    if (!config.worker) {
      throw new Error('Mandatory configuration "worker" missing. Set config.worker address');
    }

    if (!txOptions) {
      txOptions = txOptions || {};
    }

    if (!txOptions.gasPrice) {
      txOptions.gasPrice = '0x5B9ACA00';
    }

    let deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;

    //Deploy Contract
    let promiseChain = oThis.deploy(deployParams);

    //Set Worker
    promiseChain = promiseChain.then(function() {
      let _expirationHeight = config.workerExpirationHeight || WorkerExpirationHeight;
      _expirationHeight = Number(_expirationHeight);
      return oThis.setWorker(config.worker, _expirationHeight, deployParams);
    });

    //Set Admin
    if (config.admin) {
      promiseChain = promiseChain.then(function() {
        return oThis.setAdmin(config.admin, deployParams);
      });
    }

    //Initiate Ownership Transfer
    if (config.owner) {
      promiseChain = promiseChain.then(function() {
        return oThis.initiateOwnershipTransfer(config.owner, deployParams);
      });
    }

    //Claim OwnerShip
    if (config.owner && config.shouldCompleteOwnershipTransfer) {
      promiseChain = promiseChain.then(function() {
        let cTxOptions = Object.assign({}, deployParams);
        cTxOptions.from = config.owner;
        return oThis.completeOwnershipTransfer(cTxOptions);
      });
    }

    return promiseChain;
  }

  deploy(txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    let defaultOptions = {
      gas: '1600000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const contract = new web3.eth.Contract(abi, null, txOptions);
    let args = [];
    let tx = contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

    console.log('* Deploying Organization Contract');
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
        console.log('\t - Organization Contract Address:', oThis.address);
        return txReceipt;
      });
  }

  setAdmin(adminAddress, txOptions, contractAddress, web3) {
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
    let tx = contract.methods.setAdmin(adminAddress);

    console.log('* Setting Organization Admin', adminAddress);
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

  setWorker(workerAddress, _expirationHeight, txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;
    _expirationHeight = Number(_expirationHeight || WorkerExpirationHeight);

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
    let tx = contract.methods.setWorker(workerAddress, _expirationHeight);

    console.log('* Setting Organization Worker:', workerAddress, 'with _expirationHeight', _expirationHeight);
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

  initiateOwnershipTransfer(ownerAddress, txOptions, contractAddress, web3) {
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
    let tx = contract.methods.initiateOwnershipTransfer(ownerAddress);

    console.log('* Initiating Ownership Transfer to', ownerAddress);
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

  completeOwnershipTransfer(txOptions, contractAddress, web3) {
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
    let tx = contract.methods.completeOwnershipTransfer();

    console.log('* Completing Ownership Transfer. Owner:');
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

  static contract(web3, contractAddress) {
    const oThis = this;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    return contract;
  }
}

module.exports = OrganizationHelper;
