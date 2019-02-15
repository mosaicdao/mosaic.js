/**
 * @typedef {Object} UtilityTokenSetupConfig
 *
 * @property {string} deployer Address to be used to send deployment transactions.
 * @property {string} valueToken Address of EIP20 Token on Origin chain.
 * @param {string} symbol Symbol of utility token.
 * @param {string} name Name of utility token.
 * @param {string} decimal Decimal of utility token.
 * @property {string} organization Address of Organization contract managing
 *                                 Utility token.
 */

'use strict';

const BN = require('bn.js');
const Web3 = require('web3');

const AbiBinProvider = require('../AbiBinProvider');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');
const { validateConfigKeyExists } = require('./validation');

const ContractName = 'UtilityToken';

/**
 * Contract interact for UtilityToken contract.
 */
class UtilityToken {
  /**
   * Constructor for UtilityToken.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} address UtilityToken contract address.
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

    this.web3 = web3;
    this.address = address;

    this.contract = Contracts.getUtilityToken(this.web3, this.address);

    if (!this.contract) {
      throw new Error(`Could not load Utility contract for: ${this.address}`);
    }

    this.approve = this.approve.bind(this);
    this.approveRawTx = this.approveRawTx.bind(this);
    this.allowance = this.allowance.bind(this);
    this.isAmountApproved = this.isAmountApproved.bind(this);
    this.balanceOf = this.balanceOf.bind(this);
    this.setCoGateway = this.setCoGateway.bind(this);
    this.setCoGatewayRawTx = this.setCoGatewayRawTx.bind(this);
  }

  /**
   * Setup for Utility token contract. It deploys contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {UtilityTokenSetupConfig} config Utility Token setup configuration.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<UtilityToken>} Promise containing the Utility token
   *                                  instance that has been set up.
   */
  static setup(web3, config, txOptions) {
    UtilityToken.validateSetupConfig(config);

    const deployParams = Object.assign({}, txOptions);
    deployParams.from = config.deployer;
    deployParams.gasPrice = 0;

    return UtilityToken.deploy(
      web3,
      config.valueToken,
      config.symbol,
      config.name,
      config.decimal,
      config.organization,
      deployParams,
    );
  }

  /**
   * Validate the setup configuration.
   *
   * @param {UtilityTokenSetupConfig} config Utility Token setup configuration.
   *
   * @throws Will throw an error if setup configuration is incomplete.
   */
  static validateSetupConfig(config) {
    validateConfigKeyExists(config, 'deployer', 'config');
    validateConfigKeyExists(config, 'organization', 'config');
    validateConfigKeyExists(config, 'valueToken', 'config');
    validateConfigKeyExists(config, 'symbol', 'config');
    validateConfigKeyExists(config, 'name', 'config');
    validateConfigKeyExists(config, 'decimal', 'config');
  }

  /**
   * Deploys an Utility token contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} valueToken Address of EIP20 Token on Origin chain.
   * @param {string} symbol Symbol of utility token.
   * @param {string} name Name of utility token.
   * @param {string} decimal Decimal of utility token.
   * @param {string} organization Address of Organization contract managing
   *                 utility token.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<UtilityToken>} Promise containing the UtilityToken instance
   *                                  that has been deployed.
   */
  static async deploy(
    web3,
    valueToken,
    symbol,
    name,
    decimal,
    organization,
    txOptions,
  ) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    const tx = UtilityToken.deployRawTx(
      web3,
      valueToken,
      symbol,
      name,
      decimal,
      organization,
    );

    return Utils.sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new UtilityToken(web3, address);
    });
  }

  /**
   * Raw transaction for {@link UtilityToken#deploy}.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} valueToken Address of EIP20 Token on Origin chain.
   * @param {string} symbol Symbol of utility token.
   * @param {string} name Name of utility token.
   * @param {string} decimal Decimal of utility token.
   * @param {string} organization Address of Organization contract managing
   *                              Utility token.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(web3, valueToken, symbol, name, decimal, organization) {
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
    const contract = Contracts.getUtilityToken(web3, null, null);

    const bin = abiBinProvider.getBIN(ContractName);
    const args = [valueToken, symbol, name, decimal, organization];

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
   * Sets the CoGateway contract address. This can be called only by
   * an organization address.
   *
   * @param {st`ring} coGateway EIP20CoGateway contract address.
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
   * Raw transaction object for {@link UtilityToken#setCoGateway}
   *
   * @param {string} coGateway EIP20CoGateway contract address.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  setCoGatewayRawTx(coGateway) {
    if (!Web3.utils.isAddress(coGateway)) {
      const err = new TypeError(`Invalid coGateway address: ${coGateway}`);
      return Promise.reject(err);
    }

    const tx = this.contract.methods.setCoGateway(coGateway);
    return Promise.resolve(tx);
  }
}

module.exports = UtilityToken;
