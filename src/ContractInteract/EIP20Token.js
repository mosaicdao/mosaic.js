'use strict';

const BN = require('bn.js');
const Web3 = require('web3');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');

/**
 * Contract interact for EIP20Token contract.
 */
class EIP20Token {
  /**
   * Constructor for EIP20Gateway.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} tokenAddress EIP20Token contract address.
   */
  constructor(web3, tokenAddress) {
    if (web3 instanceof Web3) {
      this.web3 = web3;
    } else {
      const err = new TypeError(
        "Mandatory Parameter 'web3' is missing or invalid",
      );
      throw err;
    }

    if (!Web3.utils.isAddress(tokenAddress)) {
      const err = new TypeError(
        "Mandatory Parameter 'tokenAddress' is missing or invalid.",
      );
      throw err;
    }

    this.tokenAddress = tokenAddress;

    this.contract = Contracts.getEIP20Token(this.web3, this.tokenAddress);

    if (!this.contract) {
      const err = new Error(
        `Could not load token contract for: ${this.tokenAddress}`,
      );
      throw err;
    }

    this.approve = this.approve.bind(this);
    this._approveRawTx = this._approveRawTx.bind(this);
    this.allowance = this.allowance.bind(this);
    this.isAmountApproved = this.isAmountApproved.bind(this);
  }

  /**
   * Approves account address for the amount transfer.
   *
   * @param {string} spenderAddress Spender account address.
   * @param {string} amount Approve amount.
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
    return this._approveRawTx(spenderAddress, amount).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get raw transaction object for aprove amount.
   *
   * @param {string} spenderAddress Spender address.
   * @param {string} amount Approve amount.
   *
   * @returns {Promise<boolean>} Promise that resolves to raw transaction object.
   */
  _approveRawTx(spenderAddress, amount) {
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
        `Owner address is invalid or missing: ${ownerAddress}.`,
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
   * Check if the account has approved gateway contract.
   *
   * @param {string} ownerAddress Owner account address.
   * @param {string} spenderAddress Spender account address.
   * @param {string} amount Approval amount.
   *
   * @returns {Promise<boolean>} Promise that resolves to `true` when its approved.
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
   * @returns {Promise<Object>} Promise that resolves to balance amount.
   */
  balanceOf(accountAddress) {
    if (!Web3.utils.isAddress(accountAddress)) {
      const err = new TypeError(`Invalid address: ${accountAddress}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.balanceOf(accountAddress).call();
  }
}

module.exports = EIP20Token;
