/**
 * @typedef {Object} Library Smart contract library for use in linking.
 * @property {string} name Name of the libary, as used in linking placeholders.
 * @property {string} address Address of the deployed library.
 */

'use strict';

const mosaicContracts = require('@openst/mosaic-contracts');

const { loadContracts } = require('./AbiBinProvider-node.js');
const Linker = require('../src/utils/linker');

class AbiBinProvider {
  constructor(abiFolderPath, binFolderPath) {
    const oThis = this;

    if (abiFolderPath && binFolderPath) {
      // This only loads the contract on node.js and is currently being
      // deprecated (see issue #50). For the web target this is replaced
      // by a noop.
      loadContracts(this, abiFolderPath, binFolderPath);
    }

    oThis.custom = oThis.custom || null;
  }

  addABI(contractName, abiFileContent) {
    const oThis = this;

    oThis.custom = oThis.custom || {};

    let abi;
    if (typeof abiFileContent === 'string') {
      abi = JSON.parse(abiFileContent);
    } else if (typeof abiFileContent === 'object') {
      abi = abiFileContent;
    } else {
      const err = new Error('Abi should be either JSON String or an object');
      throw err;
    }

    const holder = (oThis.custom[contractName] =
      oThis.custom[contractName] || {});
    if (holder.abi) {
      const err = new Error(
        `Abi for Contract Name ${contractName} already exists.`,
      );
      throw err;
    }

    holder.abi = abi;
  }

  addBIN(contractName, binFileContent) {
    const oThis = this;

    oThis.custom = oThis.custom || {};

    if (typeof binFileContent !== 'string') {
      const err = new Error('Bin should be a string');
      throw err;
    }

    const holder = (oThis.custom[contractName] =
      oThis.custom[contractName] || {});
    if (holder.bin) {
      const err = new Error(
        `Bin for Contract Name ${contractName} already exists.`,
      );
      throw err;
    }

    holder.bin = binFileContent;
  }

  getABI(contractName) {
    const oThis = this;

    if (
      oThis.custom &&
      oThis.custom[contractName] &&
      oThis.custom[contractName].abi
    ) {
      return oThis.custom[contractName].abi;
    }

    const contract = mosaicContracts[contractName];
    if (!contract) {
      throw new Error(
        `Could not retrieve ABI for ${contractName}, because the contract doesn't exist.`,
      );
    }
    const { abi } = contract;
    return abi;
  }

  getBIN(contractName) {
    const oThis = this;

    if (
      oThis.custom &&
      oThis.custom[contractName] &&
      oThis.custom[contractName].bin
    ) {
      return oThis.custom[contractName].bin;
    }

    const contract = mosaicContracts[contractName];
    if (!contract) {
      throw new Error(
        `Could not retrieve bin for ${contractName}, because the contract doesn't exist.`,
      );
    }
    const bin = contract.bin;
    if (!bin) {
      throw new Error(
        `Could not retrieve bin for ${contractName}. This means that either the contract ABI was added to the AbiBinProvider without the bin, or that the contract does not produce a bin (e.g. interface contracts).`,
      );
    }
    return bin;
  }

  /**
   * Returns the a linked bin for a contract.
   *
   * @param {string} contractName Name of the contract to be linked.
   * @param {...Library} libs The libraries to be linked to the bin.
   *
   * @returns {string} The linked bin.
   */
  getLinkedBIN(contractName, ...libs) {
    const oThis = this;
    const bin = oThis.getBIN(contractName);
    if (!bin) {
      return bin;
    }

    let len = libs.length;
    const libraries = {};
    while (len--) {
      let libInfo = libs[len];
      if (typeof libInfo !== 'object' || !libInfo.name || !libInfo.address) {
        throw new Error(
          'Invalid contract info argument at index ' + (len + 1),
        );
      }
      libraries[libInfo.name] = libInfo.address;
    }
    return Linker.linkBytecode(bin, libraries);
  }

  static get Linker() {
    return Linker;
  }
}

module.exports = AbiBinProvider;
