const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const Mosaic = require('./Mosaic');

const abProvider = new AbiBinProvider();

class Contracts {
  constructor(mosaic) {
    if (!(mosaic instanceof Mosaic)) {
      const err = new TypeError('Invalid mosaic object.');
      throw err;
    }
    this.mosaic = mosaic;
  }

  ValueToken(options) {
    return Contracts.getEIP20Token(
      this.mosaic.origin.web3,
      this.mosaic.origin.contractAddresses.ValueToken,
      options,
    );
  }

  BaseToken(options) {
    return Contracts.getEIP20Token(
      this.mosaic.origin.web3,
      this.mosaic.origin.contractAddresses.BaseToken,
      options,
    );
  }

  OSTPrime(options) {
    return Contracts.getOSTPrime(
      this.mosaic.auxiliary.web3,
      this.mosaic.auxiliary.contractAddresses.OSTPrime,
      options,
    );
  }

  OriginAnchor(options) {
    return Contracts.getAnchor(
      this.mosaic.origin.web3,
      this.mosaic.origin.contractAddresses.Anchor,
      options,
    );
  }

  AuxiliaryAnchor(options) {
    return Contracts.getAnchor(
      this.mosaic.auxiliary.web3,
      this.mosaic.auxiliary.contractAddresses.Anchor,
      options,
    );
  }

  EIP20CoGateway(options) {
    return Contracts.getEIP20CoGateway(
      this.mosaic.auxiliary.web3,
      this.mosaic.auxiliary.contractAddresses.EIP20CoGateway,
      options,
    );
  }

  EIP20Gateway(options) {
    return Contracts.getEIP20Gateway(
      this.mosaic.origin.web3,
      this.mosaic.origin.contractAddresses.EIP20Gateway,
      options,
    );
  }

  OriginOrganization(options) {
    return Contracts.getOrganization(
      this.mosaic.origin.web3,
      this.mosaic.origin.contractAddresses.Organization,
      options,
    );
  }

  AuxiliaryOrganization(options) {
    return Contracts.getOrganization(
      this.mosaic.auxiliary.web3,
      this.mosaic.auxiliary.contractAddresses.Organization,
      options,
    );
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
