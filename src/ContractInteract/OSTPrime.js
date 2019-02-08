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
const {
  validateConfigExists,
  validateConfigKeyExists,
} = require('./validation');

const ContractName = 'OSTPrime';

/**
 * Contract interact for OSTPrime contract.
 */
class OSTPrime {
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
        "Mandatory Parameter 'address' is missing or invalid.",
      );
    }

    this.web3 = web3;
    this.address = address;

    this.contract = Contracts.getOSTPrime(this.web3, this.address);

    if (!this.contract) {
      throw new Error(`Could not load OSTPrime contract for: ${this.address}`);
    }

    this.approve = this.approve.bind(this);
    this.approveRawTx = this.approveRawTx.bind(this);
    this.allowance = this.allowance.bind(this);
    this.isAmountApproved = this.isAmountApproved.bind(this);
    this.wrap = this.wrap.bind(this);
    this.wrapRawTx = this.wrapRawTx.bind(this);
    this.unwrap = this.unwrap.bind(this);
    this.unwrapRawTx = this.unwrapRawTx.bind(this);
    this.balanceOf = this.balanceOf.bind(this);
    this.setCoGateway = this.setCoGateway.bind(this);
    this.setCoGatewayRawTx = this.setCoGatewayRawTx.bind(this);
    this.initialize = this.initialize.bind(this);
    this.initializeRawTx = this.initializeRawTx.bind(this);
  }

  /**
   * Setup for OSTPrime contract. Deploys the contract and initializes
   * it. See {@link OSTPrime#initialize}.
   *
   * @param {Web3} web3 Web3 object.
   * @param {OSTPrimeSetupConfig} config OSTPrime setup configuration.
   * @param {Object} txOptions Transaction options.
   *
   * @param {Promise<OSTPrime>} Promise containing the OSTPrime instance that
   *                           has been set up.
   */
  static setup(web3, config, txOptions) {
    if (!config.valueToken) {
      throw new Error(
        'Mandatory configuration "valueToken" missing. Provide EIP20 token contract address.',
      );
    }

    if (!config.organization) {
      throw new Error(
        'Mandatory configuration "organization" missing. Set config.organization address.',
      );
    }

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
    validateConfigExists(config);
    validateConfigKeyExists(config, 'deployer', 'config');
    validateConfigKeyExists(config, 'chainOwner', 'config');
  }

  /**
   * Deploys an OSTPrime contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} valueToken Address of EIP20 Token on Origin chain.
   * @param {string} organization Address of Organization contract managing OSTPrime.
   * @param {Object} txOptions Transaction options.
   *
   * @param {Promise<OSTPrime>} Promise containing the OSTPrime instance that
   *                           has been deployed.
   */
  static async deploy(web3, valueToken, organization, txOptions) {
    const tx = OSTPrime.deployRawTx(web3, valueToken, organization);

    const _txOptions = txOptions;
    if (!_txOptions.gas) {
      _txOptions.gas = await tx.estimateGas();
    }

    return Utils.sendTransaction(tx, _txOptions).then((txReceipt) => {
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
   * Approves spender address for the amount transfer.
   *
   * @param {string} spenderAddress Spender account address.
   * @param {string} amount Amount to be approved.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise<boolean>} Promise that resolves to transaction receipt.
   */
  approve(spenderAddress, amount, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    return this.approveRawTx(spenderAddress, amount).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get raw transaction object for approve amount.
   *
   * @param {string} spenderAddress Spender address.
   * @param {string} amount Approve amount.
   *
   * @returns {Promise<boolean>} Promise that resolves to raw transaction object.
   */
  approveRawTx(spenderAddress, amount) {
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError(`Invalid spender address: ${spenderAddress}.`);
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid approval amount: ${amount}.`);
      return Promise.reject(err);
    }
    const tx = this.contract.methods.approve(spenderAddress, amount);
    return Promise.resolve(tx);
  }

  /**
   * Returns the allowance amount for the given account address
   *
   * @param {string} ownerAddress Owner account address.
   * @param {string} spenderAddress Spender account address.
   *
   * @returns {Promise<string>} Promise that resolves to allowance amount.
   */
  allowance(ownerAddress, spenderAddress) {
    if (!Web3.utils.isAddress(ownerAddress)) {
      const err = new TypeError(
        `Owner address is invalid or missing: ${ownerAddress}`,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError(
        `Spender address is invalid or missing: ${spenderAddress}`,
      );
      return Promise.reject(err);
    }
    return this.contract.methods
      .allowance(ownerAddress, spenderAddress)
      .call();
  }

  /**
   * Check if the account has approved spender account for a given amount.
   *
   * @param {string} ownerAddress Owner account address.
   * @param {string} spenderAddress Spender account address.
   * @param {string} amount Approval amount.
   *
   * @returns {Promise<boolean>} Promise that resolves to `true` when it's
   *                             approved otherwise false.
   */
  isAmountApproved(ownerAddress, spenderAddress, amount) {
    if (!Web3.utils.isAddress(ownerAddress)) {
      const err = new TypeError(`Invalid owner address: ${ownerAddress}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(spenderAddress)) {
      const err = new TypeError(`Invalid spender address: ${spenderAddress}.`);
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid amount: ${amount}.`);
      return Promise.reject(err);
    }
    return this.allowance(ownerAddress, spenderAddress).then(
      (approvedAllowance) => {
        return new BN(amount).lte(new BN(approvedAllowance));
      },
    );
  }

  /**
   * Returns the balance of an account.
   *
   * @param {string} accountAddress Account address
   * @returns {Promise<string>} Promise that resolves to balance amount.
   */
  balanceOf(accountAddress) {
    if (!Web3.utils.isAddress(accountAddress)) {
      const err = new TypeError(`Invalid address: ${accountAddress}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.balanceOf(accountAddress).call();
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

  /**
   * Sets the CoGateway contract address. This can be called only by$
   * an organization address.
   *
   * @param {string} coGateway EIP20CoGateway contract address.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  setCoGateway(coGateway, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }

    return this.setCoGatewayRawTx(coGateway).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Raw transaction object for {@link OSTPrime#setCoGateway}
   *
   * @param {string} coGateway EIP20CoGateway contract address.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  setCoGatewayRawTx(coGateway) {
    if (!Web3.utils.isAddress(coGateway)) {
      const err = new TypeError('Invalid coGateway address.');
      return Promise.reject(err);
    }

    const tx = this.contract.methods.setCoGateway(coGateway);
    return Promise.resolve(tx);
  }
}

module.exports = OSTPrime;
