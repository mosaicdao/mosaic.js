const Web3 = require('web3');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils.js');
const Mosaic = require('../Mosaic');

/**
 * Class for stake helper methods
 */
class StakeHelper {
  /**
   * Constructor for stake helper.
   *
   * @param {Object} mosaic Mosaic object.
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
      const err = new TypeError('Invalid EIP20Gateway address.');
      throw err;
    }

    this.mosaic = mosaic;
    this.originWeb3 = mosaic.origin.web3;
    this.gatewayAddress = mosaic.origin.contractAddresses.EIP20Gateway;

    this.getBounty = this.getBounty.bind(this);
    this.getNonce = this.getNonce.bind(this);
    this.approveStakeAmount = this.approveStakeAmount.bind(this);
    this._getNonce = this._getNonce.bind(this);
    this._approveStakeAmountRawTx = this._approveStakeAmountRawTx.bind(this);
    this._stakeRawTx = this._stakeRawTx.bind(this);
  }

  /**
   * Returns the bounty amount from EIP20Gateway contract.
   *
   * @returns {Promise} Promise object represents the bounty.
   */
  async getBounty() {
    if (this.bountyAmount) {
      return Promise.resolve(this.bountyAmount);
    }

    const gatewayContract = Contracts.getEIP20Gateway(
      this.originWeb3,
      this.gatewayAddress,
    );

    return gatewayContract.methods
      .bounty()
      .call()
      .then((bounty) => {
        this.bountyAmount = bounty;
        return bounty;
      });
  }

  /**
   * Returns the EIP20 token address.
   *
   * @returns {Promise} Promise object represents EIP20 token address.
   */
  async getValueToken() {
    if (this.valueTokenAddress) {
      return Promise.resolve(this.valueTokenAddress);
    }

    const gatewayContract = Contracts.getEIP20Gateway(
      this.originWeb3,
      this.gatewayAddress,
    );

    return gatewayContract.methods
      .token()
      .call()
      .then((token) => {
        this.valueTokenAddress = token;
        return token;
      });
  }

  /**
   * Returns the gateway nonce for the given account address.
   *
   * @param {string} accountAddress Account address for which the nonce is to be fetched.
   *
   * @returns {Promise} Promise object represents the nonce of account address.
   */
  async getNonce(staker) {
    if (!Web3.utils.isAddress(staker)) {
      throw new TypeError(`Invalid account address: ${staker}.`);
    }
    return this._getNonce(staker, this.originWeb3, this.gatewayAddress);
  }

  /**
   * Returns the nonce for the given staker account address.
   *
   * @param {string} stakerAddress Staker address.
   * @param {Object} originWeb3 Origin web3 object.
   * @param {string} gateway EIP20Gateway contract address.
   *
   * @returns {Promise} Promise object represents the nonce of staker address.
   */
  _getNonce(stakerAddress, originWeb3, gateway) {
    const web3 = originWeb3 || this.originWeb3;
    const gatewayAddress = gateway || this.gatewayAddress;
    const contract = Contracts.getEIP20Gateway(web3, gatewayAddress);
    return contract.methods
      .getNonce(stakerAddress)
      .call()
      .then((nonce) => {
        return nonce;
      });
  }

  /**
   * Approves gateway address for the stake amount transfer.
   *
   * @param {string} stakeAmount Stake amount.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async approveStakeAmount(stakeAmount, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid staker address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    return this.getValueToken().then((valueTokenAddress) => {
      const valueToken = Contracts.getEIP20Token(
        this.originWeb3,
        valueTokenAddress,
      );
      return valueToken.methods
        .approve(this.gatewayAddress, stakeAmount)
        .then((tx) => Utils.sendTransaction(tx, txOptions));
    });
  }

  /**
   * Returns the raw transaction object for approving stake amount.
   *
   * @param {string} value Amount to approve.
   * @param {Object} txOptions Transaction options.
   * @param {Object} web3 Web3 object.
   * @param {string} valueToken Value token contract address.
   * @param {string} gateway EIP20Gateway contract address.
   * @param {string} staker Staker address.
   *
   * @returns {Object} Raw transaction object.
   */
  _approveStakeAmountRawTx(
    value,
    txOptions,
    web3,
    valueToken,
    gateway,
    staker,
  ) {
    const transactionOptions = Object.assign(
      {
        from: staker,
        to: valueToken,
        gas: '100000',
      },
      txOptions || {},
    );

    const contract = Contracts.getEIP20Token(
      web3,
      valueToken,
      transactionOptions,
    );

    const tx = contract.methods.approve(gateway, value);

    return tx;
  }

  /**
   * Returns the stake raw transaction object.
   *
   * @param {string} amount Amount to stake.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce.
   * @param {string} hashLock Hash lock.
   * @param {Object} txOptions Transaction options.
   * @param {Object} web3 Web3 object.
   * @param {string} gateway EIP20Gateway contract address.
   * @param {string} staker Staker address.
   *
   * @returns {Object} Raw transaction object.
   */
  _stakeRawTx(
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    hashLock,
    txOptions,
    web3,
    gateway,
    staker,
  ) {
    const transactionOptions = Object.assign(
      {
        from: staker,
        to: gateway,
        gas: '7000000',
      },
      txOptions || {},
    );

    const contract = Contracts.getEIP20Gateway(
      web3,
      gateway,
      transactionOptions,
    );

    const tx = contract.methods.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    );

    return tx;
  }

  /**
   * Creates a random secret string, unlock secrete and hash lock.
   *
   * @returns {HashLock} HashLock object.
   */
  static createSecretHashLock() {
    return Utils.createSecretHashLock();
  }

  /**
   * Returns the HashLock from the given secret string.
   *
   * @param {string} secretString The secret string.
   *
   * @returns {HashLock} HashLock object.
   */
  static toHashLock(secretString) {
    return Utils.toHashLock(secretString);
  }
}

module.exports = StakeHelper;
