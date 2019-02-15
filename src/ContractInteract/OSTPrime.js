/**
 * @typedef {Object} OSTPrimeSetupConfig
 *
 * @property {string} deployer Address to be used to send deployment transactions.
 * @property {string} chainOwner Address that holds all the base token funds
 *                    for initializing the OSTPrime contract.
 * @property {string} valueToken Address of EIP20 Token on Origin chain.
 * @property {string} organization Address of Organization contract managing OSTPrime.
 */

'use strict';

const BN = require('bn.js');
const Web3 = require('web3');

const AbiBinProvider = require('../AbiBinProvider');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');
const UtilityToken = require('./UtilityToken');
const { validateConfigKeyExists } = require('./validation');

const ContractName = 'OSTPrime';

/**
 * Contract interact for OSTPrime contract.
 */
class OSTPrime extends UtilityToken {
  /**
   * Constructor for OSTPrime.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} address OSTPrime contract address.
   */
  constructor(web3, address) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(address)) {
      throw new TypeError(
        `Mandatory Parameter 'address' is missing or invalid: ${address}`,
      );
    }
    super(web3, address);
    this.contract = Contracts.getOSTPrime(this.web3, this.address);

    if (!this.contract) {
      throw new Error(`Could not load OSTPrime contract for: ${this.address}`);
    }

    this.wrap = this.wrap.bind(this);
    this.wrapRawTx = this.wrapRawTx.bind(this);
    this.unwrap = this.unwrap.bind(this);
    this.unwrapRawTx = this.unwrapRawTx.bind(this);
    this.initialize = this.initialize.bind(this);
    this.initializeRawTx = this.initializeRawTx.bind(this);
  }

  /**
   * Setup for OSTPrime contract. Deploys the contract and initializes
   * it. See {@link OSTPrime#initialize}.
   *
   * The setup takes special care to make sure to transfer all available
   * unwraped base tokens of the chain it is used on to the OSTPrime contract.
   * For that it is assumed that the `config.chainOwner` holds all unwraped
   * base tokens and the transactions are done with a gasPrice of 0 so that
   * none of the tokens leak to validators via gas rewards.
   *
   * @param {Web3} web3 Web3 object.
   * @param {OSTPrimeSetupConfig} config OSTPrime setup configuration.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<OSTPrime>} Promise containing the OSTPrime instance that
   *                              has been set up.
   */
  static setup(web3, config, txOptions) {
    OSTPrime.validateSetupConfig(config);

    const deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;
    deployParams.gasPrice = 0;

    // 1. Deploy the Contract
    const ostPrime = OSTPrime.deploy(
      web3,
      config.valueToken,
      config.organization,
      deployParams,
    );

    // 2. Initialize.
    const initializedOstPrime = ostPrime.then((contract) => {
      const valueToTransfer = Web3.utils.toWei('800000000');
      const ownerParams = Object.assign({}, deployParams);
      ownerParams.from = config.chainOwner;
      ownerParams.value = valueToTransfer;

      return contract.initialize(ownerParams).then(() => contract);
    });

    return initializedOstPrime;
  }

  /**
   * Validate the setup configuration.
   *
   * @param {OSTPrimeSetupConfig} config OSTPrime setup configuration.
   *
   * @throws Will throw an error if setup configuration is incomplete.
   */
  static validateSetupConfig(config) {
    validateConfigKeyExists(config, 'deployer', 'config');
    validateConfigKeyExists(config, 'chainOwner', 'config');
    validateConfigKeyExists(config, 'organization', 'config');
    validateConfigKeyExists(config, 'valueToken', 'config');
  }

  /**
   * Deploys an OSTPrime contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} valueToken Address of EIP20 Token on Origin chain.
   * @param {string} organization Address of Organization contract managing OSTPrime.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<OSTPrime>} Promise containing the OSTPrime instance that
   *                            has been deployed.
   */
  static async deploy(web3, valueToken, organization, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = OSTPrime.deployRawTx(web3, valueToken, organization);

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new OSTPrime(web3, address);
    });
  }

  /**
   * Raw transaction for {@link OSTPrime#deploy}.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} valueToken Address of EIP20 Token on Origin chain.
   * @param {string} organization Address of Organization contract managing OSTPrime.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(web3, valueToken, organization) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError(
        `Mandatory Parameter 'web3' is missing or invalid: ${web3}`,
      );
    }
    if (!Web3.utils.isAddress(valueToken)) {
      throw new TypeError(`Invalid valueToken address: ${valueToken}.`);
    }
    if (!Web3.utils.isAddress(organization)) {
      throw new TypeError(`Invalid organization address: ${organization}.`);
    }

    const abiBinProvider = new AbiBinProvider();
    const contract = Contracts.getOSTPrime(web3, null, null);

    const bin = abiBinProvider.getBIN(ContractName);
    const args = [valueToken, organization];

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }

  /**
   * Unwrap amount.
   *
   * @param {string} amount Amount to unwrap.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  unwrap(amount, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    return this.unwrapRawTx(amount).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Initialize OSTPrime by transfering all base tokens to it.
   *
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  initialize(txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }

    return this.initializeRawTx().then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Raw transaction object for {@link OSTPrime#initialize}
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  initializeRawTx() {
    const tx = this.contract.methods.initialize();
    return Promise.resolve(tx);
  }

  /**
   * Unwrap amount raw tansaction.
   *
   * @param {string} amount Amount to unwrap.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  unwrapRawTx(amount) {
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid amount: ${amount}.`);
      return Promise.reject(err);
    }
    const tx = this.contract.methods.unwrap(amount);
    return Promise.resolve(tx);
  }

  /**
   * Wrap amount.
   *
   * @param {Object} txOptions Transaction options.
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  wrap(txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (new BN(txOptions.value).lten(0)) {
      const err = new TypeError(
        `Transaction value amount must not be zero: ${txOptions.value}.`,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    return this.wrapRawTx().then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Wrap amount raw transaction.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  wrapRawTx() {
    const tx = this.contract.methods.wrap();
    return Promise.resolve(tx);
  }
}

module.exports = OSTPrime;
