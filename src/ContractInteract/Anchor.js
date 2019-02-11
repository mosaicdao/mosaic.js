/**
 * @typedef AnchorSetupConfig
 *
 * @property {string} remoteChainId The chain id of the chain that is tracked
 *                    by this Anchor.
 * @property {string} maxStateRoots The max number of state roots to store in
 *                    the circular buffer of Anchor.
 * @property {string} organization Address of Organization contract managing
 *                    Anchor.
 * @property [string] coAnchorAddress Address of the corresponding Anchor on
 *                    the remote chain.
 * @property {string} deployer Address to be used to send deployment
 *                    transactions.
 * @property {string} organizationOwner Address of owner of `organization`.
 */

'use strict';

const Web3 = require('web3');

const AbiBinProvider = require('../AbiBinProvider');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');
const {
  validateConfigExists,
  validateConfigKeyExists,
} = require('./validation');

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

  /**
   * Setup for Anchor contract. Retrieves information about the remote chain,
   * deploys the Anchor contract, and sets its coAnchor address (if provided).
   *
   *
   * @param {Web3} web3 Web3 object.
   * @param {Web3} coWeb3 Web3 object for remote chain.
   * @param {AnchorSetupConfig} config Anchor setup configuration.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Anchor>} Promise containing the Anchor instance that
   *                            has been set up.
   */
  static setup(web3, coWeb3, config, txOptions = {}) {
    Anchor.validateSetupConfig(config);

    const deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;

    // 1. Get block and stateRoot.
    const blockHeight = config.blockHeight || 'latest';
    let promiseChain = coWeb3.eth
      .getBlock(blockHeight)
      .then((block) => ({
        initialBlockHeight: block.number,
        initialStateRoot: block.stateRoot,
      }))
      .then(({ initialStateRoot, initialBlockHeight }) => {
        // 2. Deploy the Contract
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

        return anchor
          .setCoAnchorAddress(config.coAnchorAddress, ownerParams)
          .then(() => anchor);
      });
    }

    return promiseChain;
  }

  /**
   * Validate the setup configuration.
   *
   * @param {AnchorSetupConfig} config Anchor setup configuration.
   *
   * @throws Will throw an error if setup configuration is incomplete.
   */
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

  /**
   * Deploys an Anchor contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} remoteChainId The chain id of the chain that is tracked
   *                 by this Anchor.
   * @param {string} blockHeight Block height.
   * @param {string} stateRoot Storage root.
   * @param {string} maxStateRoots The max number of state roots to store in
   *                 the circular buffer of Anchor.
   * @param {string} organization Address of Organization contract managing
   *                 Anchor.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Anchor>} Promise containing the Anchor instance that
   *                            has been deployed.
   */
  static async deploy(
    web3,
    remoteChainId,
    blockHeight,
    stateRoot,
    maxStateRoots,
    organization,
    txOptions,
  ) {
    const tx = Anchor.deployRawTx(
      web3,
      remoteChainId,
      blockHeight,
      stateRoot,
      maxStateRoots,
      organization,
    );

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new Anchor(web3, address);
    });
  }

  /**
   * Raw transaction for {@link Anchor#deploy}.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} remoteChainId The chain id of the chain that is tracked
   *                 by this Anchor.
   * @param {string} blockHeight Block height.
   * @param {string} stateRoot Storage root.
   * @param {string} maxStateRoots The max number of state roots to store in
   *                 the circular buffer of Anchor.
   * @param {string} organization Address of Organization contract managing
   *                 Anchor.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(
    web3,
    remoteChainId,
    blockHeight,
    stateRoot,
    maxStateRoots,
    organization,
  ) {
    const abiBinProvider = new AbiBinProvider();
    const contract = Contracts.getAnchor(web3, null, null);

    const bin = abiBinProvider.getBIN(ContractName);
    const args = [
      remoteChainId,
      blockHeight,
      stateRoot,
      maxStateRoots,
      organization,
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

  /**
   * Set the address of the corresponding Anchor on the remote chain.
   *
   * @param {string} coAnchorAddress The Co-Anchor address is the address
   *                 of the anchor that is deployed on the other
   *                 (origin/auxiliary) chain.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
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

  /**
   * Raw transaction object for {@link Anchor#setCoAnchorAddress}
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
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
