'use strict';

const Web3 = require('web3');

const AbiBinProvider = require('../AbiBinProvider');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');
const {
  validateConfigExists,
  validateConfigKeyExists,
} = require('../helpers/setup/validation');

const ContractName = 'Anchor';

/**
 * Contract interact for Anchor contract.
 */
class Anchor {
  /**
   * Constructor for Anchor.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} anchorAddress Anchor contract address.
   */
  constructor(web3, anchorAddress) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(anchorAddress)) {
      throw new TypeError(
        "Mandatory Parameter 'anchorAddress' is missing or invalid.",
      );
    }

    this.web3 = web3;
    this.anchorAddress = anchorAddress;

    this.contract = Contracts.getAnchor(this.web3, this.anchorAddress);

    if (!this.contract) {
      throw new TypeError(
        `Could not load anchor contract for: ${this.anchorAddress}`,
      );
    }

    this.getStateRoot = this.getStateRoot.bind(this);
    this.getLatestStateRootBlockHeight = this.getLatestStateRootBlockHeight.bind(
      this,
    );
    this.anchorStateRoot = this.anchorStateRoot.bind(this);
  }

  /*
    //Supported Configurations for setup
    {
      "remoteChainId": 123456,
      "deployer": config.deployerAddress,
      "organization": caOrganization,
      "coAnchorAddress": caAnchor,
      "maxStateRoots": maxStateRoots,
      "organizationOwner": organizationOwner
    }
  */

  // TODO: docs
  static setup(web3, coWeb3, config, txOptions = {}) {
    Anchor.validateSetupConfig(config);

    const deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;

    // 1. Get block and stateRoot.
    const blockHeight = config.blockHeight || 'latest';
    let initialBlockHeight;
    let initialStateRoot;

    let promiseChain = coWeb3.eth.getBlock(blockHeight).then((block) => {
      initialBlockHeight = block.number;
      initialStateRoot = block.stateRoot;
    });

    // 2. Deploy the Contract
    promiseChain = promiseChain.then(() => {
      return Anchor.deploy(
        web3,
        config.remoteChainId,
        initialBlockHeight,
        initialStateRoot,
        config.maxStateRoots,
        config.organization,
        deployParams,
      );
    });

    // 3. Set coAnchorAddress.
    if (config.coAnchorAddress) {
      promiseChain = promiseChain.then((anchor) => {
        const ownerParams = Object.assign({}, deployParams);
        ownerParams.from = config.organizationOwner;

        return anchor.setCoAnchorAddress(config.coAnchorAddress, ownerParams);
      });
    }

    return promiseChain;
  }

  static validateSetupConfig(config) {
    validateConfigExists(config);
    validateConfigKeyExists(config, 'deployer', 'config');
    validateConfigKeyExists(config, 'organization', 'config');
    validateConfigKeyExists(config, 'remoteChainId', 'config');

    if (config.coAnchorAddress && !config.organizationOwner) {
      throw new Error(
        'Mandatory configuration "organizationOwner" missing. Set config.organizationOwner address. organizationOwner is mandatory when using coAnchorAddress config option',
      );
    }
  }

  static async deploy(
    web3,
    remoteChainId,
    blockHeight,
    stateRoot,
    maxStateRoots,
    membersManager,
    txOptions,
  ) {
    const tx = Anchor.deployRawTx(
      web3,
      remoteChainId,
      blockHeight,
      stateRoot,
      maxStateRoots,
      membersManager,
    );

    const _txOptions = txOptions;
    if (!_txOptions.gas) {
      _txOptions.gas = await tx.estimateGas();
    }

    return Utils.sendTransaction(tx, _txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new Anchor(web3, address);
    });
  }

  static deployRawTx(
    web3,
    remoteChainId,
    blockHeight,
    stateRoot,
    maxStateRoots,
    membersManager,
  ) {
    const abiBinProvider = new AbiBinProvider();
    const contract = Contracts.getAnchor(web3, null, null);

    const bin = abiBinProvider.getBIN(ContractName);
    const args = [
      remoteChainId,
      blockHeight,
      stateRoot,
      maxStateRoots,
      membersManager,
    ];

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }

  /**
   * Get the state root for given block height.
   *
   * @param {string} blockHeight Block height.
   * @returns {Promise<string>} Promise that resolves to state root.
   */
  getStateRoot(blockHeight) {
    if (typeof blockHeight !== 'string') {
      const err = new TypeError(`Invalid block height: ${blockHeight}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.getStateRoot(blockHeight).call();
  }

  /**
   * Get the latest committed block height.
   *
   * @returns {Promise<string>} Promise that resolves to block height.
   */
  getLatestStateRootBlockHeight() {
    return this.contract.methods.getLatestStateRootBlockHeight().call();
  }

  /**
   * Commit state root for a block height.
   *
   * @param {string} blockHeight Block height.
   * @param {string} stateRoot Storage root.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  anchorStateRoot(blockHeight, stateRoot, txOptions) {
    if (typeof blockHeight !== 'string') {
      const err = new TypeError(`Invalid block height: ${blockHeight}.`);
      return Promise.reject(err);
    }
    if (typeof stateRoot !== 'string') {
      const err = new TypeError(`Invalid state root: ${stateRoot}.`);
      return Promise.reject(err);
    }
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    const tx = this.contract.methods.anchorStateRoot(blockHeight, stateRoot);
    return Utils.sendTransaction(tx, txOptions);
  }

  /**
   * Get the latest state root and block height.
   *
   * @returns {Promise<Object>} Promise object that resolves to object containing state root and block height.
   */
  async getLatestInfo() {
    const blockHeight = await this.getLatestStateRootBlockHeight();
    const stateRoot = await this.getStateRoot(blockHeight);

    return {
      blockHeight,
      stateRoot,
    };
  }

  // TODO: docs
  setCoAnchorAddress(coAnchorAddress, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError('Invalid from address.');
      return Promise.reject(err);
    }

    return this.setCoAnchorAddressRawTx(coAnchorAddress).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  // TODO: docs
  setCoAnchorAddressRawTx(coAnchorAddress) {
    if (!Web3.utils.isAddress(coAnchorAddress)) {
      const err = new TypeError('Invalid coAnchor address.');
      return Promise.reject(err);
    }

    return Promise.resolve(
      this.contract.methods.setCoAnchorAddress(coAnchorAddress),
    );
  }
}

module.exports = Anchor;
