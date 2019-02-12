'use strict';

const Web3 = require('web3');

const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../utils/Utils');

const ContractName = 'GatewayLib';

/**
 * Contract interact for GatewayLib.
 *
 * As GatewayLib is a library contract, this only serves for deployment.
 */
class GatewayLib {
  /**
   * Constructor for GatewayLib.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} libraryAddress GatewayLib contract address.
   */
  constructor(web3, libraryAddress) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(libraryAddress)) {
      throw new TypeError(
        "Mandatory Parameter 'libraryAddress' is missing or invalid.",
      );
    }

    this.web3 = web3;
    this.address = libraryAddress;
  }

  /**
   * Deploys a GatewayLib contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} merklePatriciaProof Address of MerklePatriciaProof contract
   *                 to link into the contract bytecode.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<GatewayLib>} Promise containing the GatewayLib
   *                                         instance that has been deployed.
   */
  static async deploy(web3, merklePatriciaProof, txOptions) {
    const tx = GatewayLib.deployRawTx(web3, merklePatriciaProof);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new GatewayLib(web3, address);
    });
  }

  /**
   * Raw transaction object for {@link GatewayLib#deploy}
   *
   * @param {Object} web3 Web3 object.
   * @param {string} merklePatriciaProof Address of MerklePatriciaProof contract
   *                 to link into the contract bytecode.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  static deployRawTx(web3, merklePatriciaProof) {
    const merklePatriciaProofInfo = {
      name: 'MerklePatriciaProof',
      address: merklePatriciaProof,
    };
    const abiBinProvider = new AbiBinProvider();
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getLinkedBIN(
      ContractName,
      merklePatriciaProofInfo,
    );

    const args = [];
    const contract = new web3.eth.Contract(abi, null, null);

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }
}

module.exports = GatewayLib;
