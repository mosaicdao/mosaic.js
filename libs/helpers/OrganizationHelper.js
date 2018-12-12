const Web3 = require('web3');
const AbiBinProvider = require('../../libs/AbiBinProvider');

class OrganizationHelper {
  constructor(web3, address) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  deployOrganization(args, txOptions, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI('Organization');
    const bin = abiBinProvider.getBIN('Organization');

    let defaultOptions = {
      gas: '7000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const contract = new web3.eth.Contract(abi, null, txOptions);
    let tx = contract.deploy(
      {
        data: abiBinProvider.getBIN('Organization'),
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
        console.log('\t - Receipt:', receipt);
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
    const abi = abiBinProvider.getABI('Organization');
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    let tx = contract.methods.setAdmin(adminAddress);

    console.log('* Setting Organization Admin');
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:', receipt);
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  setWorker(workerAddress, txOptions, contractAddress, web3) {
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
    const abi = abiBinProvider.getABI('Organization');
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    let tx = contract.methods.setAdmin(workerAddress);

    console.log('* Setting Organization Worker');
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:', receipt);
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
    const abi = abiBinProvider.getABI('Organization');
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    let tx = contract.methods.initiateOwnershipTransfer(ownerAddress);

    console.log('* Initiating Ownership Transfer to', ownerAddress);
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:', receipt);
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

    console.log('1. txOptions.from:', txOptions.from, 'txOptions:\n', txOptions);

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI('Organization');
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    let tx = contract.methods.completeOwnershipTransfer();

    console.log('2. txOptions.from:', txOptions.from, 'txOptions:\n', txOptions);
    console.log('* Completing Ownership Transfer. Owner:');
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:', receipt);
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }
}

module.exports = OrganizationHelper;
