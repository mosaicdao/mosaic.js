'use strict';

const Web3 = require('web3');

const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../utils/Utils');

const ContractName = 'MerklePatriciaProof';

/**
 * Contract interact for MerklePatriciaProof.
 *
 * As MerklePatriciaProof is a library contract, this only serves for deployment.
 */
class MerklePatriciaProof {
  /**
   * Constructor for MerklePatriciaProof.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} libraryAddress MerklePatriciaProof contract address.
   */
  constructor(web3, libraryAddress) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(libraryAddress)) {
      throw new TypeError(
        `Mandatory Parameter 'libraryAddress' is missing or invalid: ${libraryAddress}`,
      );
    }

    this.web3 = web3;
    this.address = libraryAddress;
  }

  /**
   * Deploys a MerklePatriciaProof contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<MerklePatriciaProof>} Promise containing the MerklePatriciaProof
   *                                         instance that has been deployed.
   */
  static async deploy(web3, txOptions) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError(
        `Mandatory Parameter 'web3' is missing or invalid: ${web3}`,
      );
    }
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = MerklePatriciaProof.deployRawTx(web3);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new MerklePatriciaProof(web3, address);
    });
  }

  /**
   * Raw transaction object for {@link MerklePatriciaProof#deploy}
   *
   * @param {Object} web3 Web3 object.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  static deployRawTx(web3) {
    const abiBinProvider = new AbiBinProvider();
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getBIN(ContractName);

    const args = [];
    const contract = new web3.eth.Contract(abi, null, null);

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }
}

module.exports = MerklePatriciaProof;
