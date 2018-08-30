'use strict';

const DeployContract = function(params) {
  const oThis = this;

  oThis.web3 = params.web3;
  oThis.contractName = params.contractName;
  oThis.deployerAddress = params.deployerAddress;
  oThis.deployerPassphrase = params.deployerPassphrase;
  oThis.gasPrice = params.gasPrice;
  oThis.gas = params.gas;
  oThis.abi = params.abi;
  oThis.bin = params.bin;
  oThis.args = params.args;
};

DeployContract.prototype = {

  deploy: async function() {
    const oThis = this;

    let txOptions = {
      from: oThis.deployerAddress,
      gas: oThis.gas,
      data: oThis.bin,
      gasPrice: oThis.gasPrice
    };

    if (oThis.args) {
      txOptions.arguments = oThis.args;
    }

    const contract = new oThis.web3.eth.Contract(oThis.abi, null, txOptions);

    let tx = contract.deploy(txOptions),
      transactionHash = null,
      receipt = null;

    console.log('Unlock account ' + oThis.deployerAddress);
    await oThis.web3.eth.personal.unlockAccount(oThis.deployerAddress, oThis.deployerPassphrase);

    console.log('Deploying contract ' + oThis.contractName);
    const instance = await tx
      .send()
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

    // checking if the contract was deployed at all.
    const code = await oThis.web3.eth.getCode(instance.options.address);

    if (code.length <= 2) {
      return Promise.reject('Contract deployment failed. oThis.web3.eth.getCode returned empty code.');
    }

    console.log('Address  : ' + instance.options.address);
    console.log('Gas used : ' + receipt.gasUsed);

    return Promise.resolve({
      receipt: receipt,
      instance: instance
    });
  }
};

module.exports = DeployContract;
