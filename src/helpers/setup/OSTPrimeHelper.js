'use strict';

const Web3 = require('web3');
const {
  sendTransaction,
  deprecationNoticeChainSetup,
} = require('../../utils/Utils');
const OSTPrime = require('../../ContractInteract/OSTPrime');

class OSTPrimeHelper {
  constructor(web3, address) {
    this.web3 = web3;
    this.address = address;

    this.deploy = this.deploy.bind(this);
    this.initialize = this.initialize.bind(this);
    this.setCoGateway = this.setCoGateway.bind(this);
  }

  deploy(_valueToken, _organization, txOptions, web3 = this.web3) {
    deprecationNoticeChainSetup('OSTPrimeHelper.deploy');

    const defaultOptions = {
      gas: '2500000',
      gasPrice: 0,
    };

    const _txOptions = Object.assign({}, defaultOptions, txOptions);
    const tx = OSTPrime.deployRawTx(web3, _valueToken, _organization);

    return sendTransaction(tx, _txOptions).then((txReceipt) => {
      this.address = txReceipt.contractAddress;
      return txReceipt;
    });
  }

  initialize(txOptions, contractAddress = this.address, web3 = this.web3) {
    deprecationNoticeChainSetup('OSTPrimeHelper.initialize');
    const valueToTransfer = Web3.utils.toWei('800000000');

    const defaultOptions = {
      gas: '60000',
      value: valueToTransfer,
      gasPrice: 0,
    };

    const _txOptions = Object.assign({}, defaultOptions, txOptions);

    const ostPrime = new OSTPrime(web3, contractAddress);
    return ostPrime.initialize(_txOptions);
  }

  setCoGateway(
    cogateway,
    txOptions,
    contractAddress = this.address,
    web3 = this.web3,
  ) {
    deprecationNoticeChainSetup('OSTPrimeHelper.setCoGateway');

    const defaultOptions = {
      gas: '60000',
      gasPrice: 0,
    };
    const _txOptions = Object.assign({}, defaultOptions, txOptions);

    const ostPrime = new OSTPrime(web3, contractAddress);
    return ostPrime.setCoGateway(cogateway, _txOptions);
  }
}

module.exports = OSTPrimeHelper;
