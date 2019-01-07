'use strict';

//__NOT_FOR_WEB__BEGIN__
const fs = require('fs'),
  path = require('path');
//__NOT_FOR_WEB__END__

const Linker = require('../libs/utils/linker');

class AbiBinProvider {
  constructor(abiFolderPath, binFolderPath) {
    const oThis = this;
    oThis.abiFolderPath = abiFolderPath || '../contracts/abi/';
    oThis.binFolderPath = binFolderPath || '../contracts/bin/';
    oThis.custom = oThis.custom || null;
  }

  addABI(contractName, abiFileContent) {
    const oThis = this;

    oThis.custom = oThis.custom || {};

    let abi;
    if (typeof abiFileContent === 'string') {
      //Parse it.
      abi = JSON.parse(abiFileContent);
    } else if (typeof abiFileContent === 'object') {
      abi = abiFileContent;
    } else {
      let err = new Error('Abi should be either JSON String or an object');
      throw err;
    }

    let holder = (oThis.custom[contractName] = oThis.custom[contractName] || {});
    if (holder.abi) {
      let err = new Error(`Abi for Contract Name ${contractName} already exists.`);
      throw err;
    }

    holder.abi = abi;
  }

  addBIN(contractName, binFileContent) {
    const oThis = this;

    oThis.custom = oThis.custom || {};

    if (typeof binFileContent !== 'string') {
      //Parse it.
      let err = new Error('Bin should be a string');
      throw err;
    }

    let holder = (oThis.custom[contractName] = oThis.custom[contractName] || {});
    if (holder.bin) {
      let err = new Error(`Bin for Contract Name ${contractName} already exists.`);
      throw err;
    }

    holder.bin = binFileContent;
  }

  getABI(contractName) {
    const oThis = this;

    if (oThis.custom && oThis.custom[contractName] && oThis.custom[contractName].abi) {
      return oThis.custom[contractName].abi;
    }

    //__NOT_FOR_WEB__BEGIN__
    let fPath = path.resolve(__dirname, oThis.abiFolderPath, contractName + '.abi');
    abiFileContent = fs.readFileSync(fPath, 'utf8');
    let abi = JSON.parse(abiFileContent);
    return abi;
    //__NOT_FOR_WEB__END__
  }

  getBIN(contractName) {
    const oThis = this;

    if (oThis.custom && oThis.custom[contractName] && oThis.custom[contractName].bin) {
      return oThis.custom[contractName].bin;
    }

    //__NOT_FOR_WEB__BEGIN__
    let fPath = path.resolve(__dirname, oThis.binFolderPath, contractName + '.bin');
    bin = fs.readFileSync(fPath, 'utf8');
    if (typeof binCode === 'string' && binCode.indexOf('0x') != 0) {
      binCode = '0x' + binCode;
    }
    return binCode;
    //__NOT_FOR_WEB__END__
  }

  //Note
  //links is an array of
  //Send as many libInfo as needed.
  //libInfo format:
  /* 
  {
    "name": "NAME_OF_LIB",
    "address": "ADDRESS_OF_DEPLOYED_LIB"
  }
  */
  getLinkedBIN(contractName) {
    const oThis = this;
    let bin = oThis.getBIN(contractName);
    if (!bin) {
      return bin;
    }

    const libs = Array.from(arguments);
    libs.shift();
    let len = libs.length;
    let libraries = {};
    while (len--) {
      let libInfo = libs[len];
      if (typeof libInfo !== 'object' || !libInfo.name || !libInfo.address) {
        throw new Error('Invalid contract info argument at index ' + (len + 1));
      }
      libraries[libInfo.name] = libInfo.address;
    }
    return Linker.linkBytecode(bin, libraries);
  }

  _read(filePath) {
    //__NOT_FOR_WEB__BEGIN__
    filePath = path.join(__dirname, '/' + filePath);
    return fs.readFileSync(filePath, 'utf8');
    //__NOT_FOR_WEB__END__
  }

  static get Linker() {
    return Linker;
  }
}

module.exports = AbiBinProvider;
