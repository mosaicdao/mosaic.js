const Web3 = require('web3');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const Mosaic = require('../Mosaic');

/**
 * This can be used by redeemer to perform redeem related tasks like approving
 * CoGateway contract and to initiate revert the redeem flow.
 */
class Redeemer {
  /**
   * Constructor for staker.
   *
   * @param {Object} mosaic Mosaic object.
   */
  constructor(mosaic) {
    if (!(mosaic instanceof Mosaic)) {
      const err = new TypeError('Invalid mosaic object.');
      throw err;
    }
    if (!(mosaic.auxiliary.web3 instanceof Web3)) {
      const err = new TypeError('Invalid auxiliary web3 object.');
      throw err;
    }
    if (
      !Web3.utils.isAddress(mosaic.auxiliary.contractAddresses.EIP20CoGateway)
    ) {
      const err = new TypeError(
        `Invalid CoGateway address: ${
          mosaic.auxiliary.contractAddresses.EIP20CoGateway
        }.`,
      );
      throw err;
    }

    this.web3 = mosaic.auxiliary.web3;
    this.coGatewayAddress = mosaic.auxiliary.contractAddresses.EIP20CoGateway;
    this.coGatewayContract = new EIP20CoGateway(
      this.web3,
      this.coGatewayAddress,
    );

    this.approveRedeemAmount = this.approveRedeemAmount.bind(this);
  }

  /**
   * Approve CoGateway contract for token transfer.
   *
   * @param {string} amount Redeem amount
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<object>} Promise that resolves to transaction receipt.
   */
  approveRedeemAmount(amount, txOptions) {
    if (typeof amount !== 'string') {
      const err = new Error(`Invalid redeem amount: ${amount}.`);
      return Promise.reject(err);
    }
    if (!txOptions) {
      const err = new Error(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new Error(`Invalid redeemer address: ${txOptions.from}.`);
      return Promise.reject(err);
    }

    return this.coGatewayContract
      .getEIP20UtilityToken()
      .then((utilityToken) => {
        return utilityToken.approve(this.coGatewayAddress, amount, txOptions);
      });
  }
}

module.exports = Redeemer;
