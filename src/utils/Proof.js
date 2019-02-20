'use strict';

const rlp = require('rlp');

// This is the position of message outbox defined in GatewayBase.sol
const MESSAGE_OUTBOX_OFFSET = '7';

// This is the position of message inbox defined in GatewayBase.sol
const MESSAGE_INBOX_OFFSET = '8';

/**
 * Utils class to generate inbox and outbox proof.
 */
class Proof {
  /**
   *
   * @param {Web3} sourceWeb3 Web3 instance connected to source chain.
   * @param {Web3} targetWeb3 Web3 instance connected to target chain.
   */
  constructor(sourceWeb3, targetWeb3) {
    this.sourceWeb3 = sourceWeb3;
    this.targetWeb3 = targetWeb3;

    this.getInboxProof = this.getInboxProof.bind(this);
    this.getOutboxProof = this.getOutboxProof.bind(this);
    this._getProof = this._getProof.bind(this);
    this._fetchProof = this._fetchProof.bind(this);
    this._storagePath = this._storagePath.bind(this);
    this._serializeProof = this._serializeProof.bind(this);
  }

  /**
   * Get proof for inbox
   * @param {string} address Address of ethereum account for which proof needs
   *                         to be generated.
   * @param {String[]}keys Array of keys for a mapping in solidity.
   * @param {String }blockNumber Block number in hex.
   *
   * @return {Object} Proof data.
   */
  getInboxProof(address, keys = [], blockNumber) {
    return this._getProof(
      this.targetWeb3,
      MESSAGE_INBOX_OFFSET,
      address,
      keys,
      blockNumber,
    );
  }

  /**
   * Get proof for outbox
   *
   * @param address Address of ethereum account for which proof needs to be
   *                generated.
   * @param keys Array of keys for a mapping in solidity.
   * @param blockNumber Block number.
   *
   * @return {Object} Proof data.
   */
  getOutboxProof(address, keys = [], blockNumber) {
    return this._getProof(
      this.sourceWeb3,
      MESSAGE_OUTBOX_OFFSET,
      address,
      keys,
      blockNumber,
    );
  }

  /**
   * Get proof data, if blockNumber is not passed it will generate proof for
   * latest block.
   *
   * @param {Web3} web3 web3 instance of chain from which proof is generated.
   * @param {string} index Storage index.
   * @param {string} address Address of ethereum account for which proof needs
   *                         to be generated.
   * @param {string[]} keys Array of keys for a mapping in solidity.
   * @param {string} blockNumber Block number in hex.
   *
   * @return {Object} Proof data.
   */
  async _getProof(web3, index, address, keys, blockNumber) {
    if (!blockNumber) {
      try {
        const block = await web3.eth.getBlock('latest');
        blockNumber = await web3.utils.toHex(block.number);
      } catch (exception) {
        return Promise.reject(exception);
      }
    }
    const storageKey = this._storagePath(web3, index, keys);
    return this._fetchProof(web3, address, [storageKey], blockNumber).then(
      (proof) => {
        const proofData = proof.result;
        proofData.block_number = blockNumber;
        return proofData;
      },
    );
  }

  /**
   * Fetch proof from geth RPC call and serialize it in desired format.
   *
   * @param {Web3} web3 web3 instance of chain from which proof is generated.
   * @param {string} address Address of ethereum account for which proof needs
   *                         to be generated.
   * @param {String[]} storageKeys Array of keys for a mapping in solidity.
   * @param {string} blockNumber Block number in hex.
   *
   * @return {Promise<Proof>}
   */
  async _fetchProof(web3, address, storageKeys = [], blockNumber = 'latest') {
    const params = [address, storageKeys, blockNumber];
    return new Promise((resolve, reject) => {
      web3.currentProvider.send(
        {
          jsonrpc: '2.0',
          method: 'eth_getProof',
          params,
          id: new Date().getTime(),
        },
        (err, response) => {
          if (response) {
            try {
              const accountProof = response.result.accountProof;
              const storageProofs = response.result.storageProof;

              response.result.serializedAccountProof = this._serializeProof(
                accountProof,
              );
              response.result.encodedAccountValue = Proof._encodedAccountValue(
                response.result.serializedAccountProof,
              );

              storageProofs.forEach((sp) => {
                sp.serializedProof = this._serializeProof(sp.proof);
              });
              resolve(response);
            } catch (exception) {
              reject(exception);
            }
          }
          reject(err);
        },
      );
    });
  }

  /**
   * Provides storage path.
   *
   * @param {Web3} web3 web3 instance of chain from which proof is generated.
   * @param {string} storageIndex Position of storage in the contract.
   * @param {String[]}mappings  list of keys in case storage is mapping.
   *
   * @return {string} Storage path.
   * @private
   */
  _storagePath(web3, storageIndex, mappings) {
    let path = '';

    if (mappings && mappings.length > 0) {
      mappings.map((mapping) => {
        path = `${path}${web3.utils.padLeft(mapping, 64)}`;
      });
    }

    path = `${path}${web3.utils.padLeft(storageIndex, 64)}`;
    path = web3.utils.sha3(path, { encoding: 'hex' });

    return path;
  }

  /**
   * Flatten the array of nodes.
   *
   * @param {Object} proof Array of nodes representing merkel proof.
   *
   * @return {string} Serialized proof.
   *
   * @private
   */
  _serializeProof(proof) {
    const serializedProof = [];
    proof.forEach((p) => serializedProof.push(rlp.decode(p)));
    return `0x${rlp.encode(serializedProof).toString('hex')}`;
  }

  /**
   *  Fetch rlp encoded account value (nonce, balance, code hash, storageRoot)
   *
   * @param {string} accountProof Account proof.
   *
   * @return {string}
   *
   * @private
   */
  static _encodedAccountValue(accountProof) {
    const decodedProof = rlp.decode(accountProof);
    const leafElement = decodedProof[decodedProof.length - 1];
    return `0x${leafElement[leafElement.length - 1].toString('hex')}`;
  }
}

module.exports = Proof;
