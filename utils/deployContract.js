'use strict';

const DeployContract = function(params) {
  const oThis = this;

  Object.assign(oThis, params);
  if (!oThis.bin) {
    throw 'Invalid Contract Bin. Please provide params.bin.';
  }
  oThis.bin = String(oThis.bin);
};

DeployContract.prototype = {
  deploy: async function() {
    const oThis = this;

    let txOptions = {
      from: oThis.deployerAddress,
      gas: oThis.gas,
      gasPrice: oThis.gasPrice
    };

    if (oThis.args) {
      txOptions.arguments = oThis.args;
    }

    if (oThis.bin.indexOf('0x') !== 0) {
      oThis.bin = '0x' + oThis.bin;
    }

    const contract = new oThis.web3.eth.Contract(oThis.abi, null, txOptions);

    let deployOptions = {
      data: oThis.bin,
      arguments: oThis.args || []
    };

    let tx = contract.deploy(deployOptions),
      transactionHash = null,
      receipt = null;

    console.log('Deploying contract ' + oThis.contractName);
    const instance = await tx
      .send(txOptions)
      .on('receipt', function(value) {
        receipt = value;
      })
      .on('transactionHash', function(value) {
        console.log('transaction hash: ' + value);
        transactionHash = value;
      })
      .on('error', function(error) {
        return Promise.reject(error);
      })
      .then(function(deployResponse) {
        // This then is just for debug purpose.
        // console.log("deployResponse", deployResponse);
        return deployResponse;
      });

    const code = await oThis.web3.eth.getCode(receipt.contractAddress);

    if (code.length <= 2) {
      return Promise.reject('Contract deployment failed. oThis.web3.eth.getCode returned empty code.');
    }
    console.log('Address  : ' + receipt.contractAddress);
    console.log('Gas used : ' + receipt.gasUsed);

    return Promise.resolve({
      receipt: receipt,
      instance: instance
    });
  }
};

module.exports = DeployContract;
