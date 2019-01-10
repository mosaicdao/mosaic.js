'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('../libs/AbiBinProvider');
let abProvider = new AbiBinProvider();

class Contracts {
  constructor(originWeb3, auxiliaryWeb3) {
    const oThis = this;

    oThis.originWeb3 = Contracts._getWeb3(originWeb3);
    oThis.auxiliaryWeb3 = Contracts._getWeb3(auxiliaryWeb3);
  }

  SimpleToken(address, options) {
    const oThis = this;
    let web3 = oThis.originWeb3;
    return Contracts.getEIP20Token(web3, address, options);
  }

  OSTPrime(address, options) {
    const oThis = this;
    let web3 = oThis.auxiliaryWeb3;
    return Contracts.getOSTPrime(web3, address, options);
  }

  OriginAnchor(address, options) {
    const oThis = this;
    let web3 = oThis.originWeb3;
    return Contracts.getAnchor(web3, address, options);
  }

  AuxiliaryAnchor(address, options) {
    const oThis = this;
    let web3 = oThis.auxiliaryWeb3;
    return Contracts.getAnchor(web3, address, options);
  }

  CoGateway(address, options) {
    const oThis = this;
    let web3 = oThis.auxiliaryWeb3;
    return Contracts.getEIP20CoGateway(web3, address, options);
  }

  Gateway(address, options) {
    const oThis = this;
    let web3 = oThis.originWeb3;
    return Contracts.getEIP20Gateway(web3, address, options);
  }

  OriginOrganization(address, options) {
    const oThis = this;
    let web3 = oThis.originWeb3;
    return Contracts.getOrganization(web3, address, options);
  }

  AuxiliaryOrganization(address, options) {
    const oThis = this;
    let web3 = oThis.auxiliaryWeb3;
    return Contracts.getOrganization(web3, address, options);
  }

  static getAnchor(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    const contractName = 'Anchor';
    let jsonInterface = abProvider.getABI(contractName);
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getEIP20CoGateway(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    const contractName = 'EIP20CoGateway';
    let jsonInterface = abProvider.getABI(contractName);
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getEIP20Gateway(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    const contractName = 'EIP20Gateway';
    let jsonInterface = abProvider.getABI(contractName);
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getOrganization(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    const contractName = 'Organization';
    let jsonInterface = abProvider.getABI(contractName);
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getOSTPrime(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    const contractName = 'OSTPrime';
    let jsonInterface = abProvider.getABI(contractName);
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getEIP20Token(web3, address, options) {
    web3 = Contracts._getWeb3(web3);
    const contractName = 'EIP20Token';
    let jsonInterface = abProvider.getABI(contractName);
    let contract = new web3.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static _getWeb3(web3) {
    if (web3 instanceof Web3) {
      return web3;
    }
    if (typeof web3 === 'string') {
      return new Web3(web3);
    }
    throw 'Invalid web3. Please provide an instanceof Web3(version: ' + Web3.version + ' )';
  }
}

module.exports = Contracts;
