const Web3 = require('web3');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const Mosaic = require('../Mosaic');

/**
 * This can be used by staker to perform stake related tasks like approving
 * Gateway contract and to initiate the revert stake flow.
 */
class Staker {
  /**
   * Constructor for staker.
   *
   * @param {Mosaic} mosaic Mosaic object.
   */
  constructor(mosaic) {
    if (!(mosaic instanceof Mosaic)) {
      const err = new TypeError('Invalid mosaic object.');
      throw err;
    }
    if (!(mosaic.origin.web3 instanceof Web3)) {
      const err = new TypeError('Invalid origin web3 object.');
      throw err;
    }
    if (!Web3.utils.isAddress(mosaic.origin.contractAddresses.EIP20Gateway)) {
      const err = new TypeError(
        `Invalid EIP20Gateway address: ${
          mosaic.origin.contractAddresses.EIP20Gateway
        }.`,
      );
      throw err;
    }

    this.web3 = mosaic.origin.web3;
    this.gatewayAddress = mosaic.origin.contractAddresses.EIP20Gateway;
    this.gatewayContract = new EIP20Gateway(this.web3, this.gatewayAddress);

    this.approveStakeAmount = this.approveStakeAmount.bind(this);
  }

  /**
   * Approve Gateway contract for token transfer.
   *
   * @param {string} amount Redeem amount
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  approveStakeAmount(amount, txOptions) {
    if (typeof amount !== 'string') {
      const err = new Error(`Invalid stake amount: ${amount}.`);
      return Promise.reject(err);
    }
    if (!txOptions) {
      const err = new Error(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new Error(`Invalid staker address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    return this.gatewayContract.getValueTokenContract().then((token) => {
      return token.approve(this.gatewayAddress, amount, txOptions);
    });
  }
}

module.exports = Staker;
