'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');

const abProvider = new AbiBinProvider();

class Contracts {
  constructor(originWeb3, auxiliaryWeb3) {
    this.originWeb3 = Contracts._getWeb3(originWeb3);
    this.auxiliaryWeb3 = Contracts._getWeb3(auxiliaryWeb3);
  }

  ValueToken(address, options) {
    return Contracts.getEIP20Token(this.originWeb3, address, options);
  }

  BaseToken(address, options) {
    return Contracts.getEIP20Token(this.originWeb3, address, options);
  }

  OSTPrime(address, options) {
    return Contracts.getOSTPrime(this.auxiliaryWeb3, address, options);
  }

  OriginAnchor(address, options) {
    return Contracts.getAnchor(this.originWeb3, address, options);
  }

  AuxiliaryAnchor(address, options) {
    return Contracts.getAnchor(this.auxiliaryWeb3, address, options);
  }

  EIP20CoGateway(address, options) {
    return Contracts.getEIP20CoGateway(this.auxiliaryWeb3, address, options);
  }

  EIP20Gateway(address, options) {
    return Contracts.getEIP20Gateway(this.originWeb3, address, options);
  }

  OriginOrganization(address, options) {
    return Contracts.getOrganization(this.originWeb3, address, options);
  }

  AuxiliaryOrganization(address, options) {
    return Contracts.getOrganization(this.auxiliaryWeb3, address, options);
  }

  static getAnchor(web3, address, options) {
    const web3Obj = Contracts._getWeb3(web3);
    const contractName = 'Anchor';
    const jsonInterface = abProvider.getABI(contractName);
    const contract = new web3Obj.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getEIP20CoGateway(web3, address, options) {
    const web3Obj = Contracts._getWeb3(web3);
    const contractName = 'EIP20CoGateway';
    const jsonInterface = abProvider.getABI(contractName);
    const contract = new web3Obj.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getEIP20Gateway(web3, address, options) {
    const web3Obj = Contracts._getWeb3(web3);
    const contractName = 'EIP20Gateway';
    const jsonInterface = abProvider.getABI(contractName);
    const contract = new web3Obj.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getOrganization(web3, address, options) {
    const web3Obj = Contracts._getWeb3(web3);
    const contractName = 'Organization';
    const jsonInterface = abProvider.getABI(contractName);
    const contract = new web3Obj.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getOSTPrime(web3, address, options) {
    const web3Obj = Contracts._getWeb3(web3);
    const contractName = 'OSTPrime';
    const jsonInterface = abProvider.getABI(contractName);
    const contract = new web3Obj.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getEIP20Token(web3, address, options) {
    const web3Obj = Contracts._getWeb3(web3);
    const contractName = 'EIP20Token';
    const jsonInterface = abProvider.getABI(contractName);
    const contract = new web3Obj.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static getUtilityToken(web3, address, options) {
    const web3Obj = Contracts._getWeb3(web3);
    const contractName = 'UtilityToken';
    const jsonInterface = abProvider.getABI(contractName);
    const contract = new web3Obj.eth.Contract(jsonInterface, address, options);
    return contract;
  }

  static _getWeb3(web3) {
    if (web3 instanceof Web3) {
      return web3;
    }
    if (typeof web3 === 'string') {
      return new Web3(web3);
    }
    return web3;
  }
}

module.exports = Contracts;
