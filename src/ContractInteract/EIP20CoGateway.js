'use strict';

const Web3 = require('web3');
const BN = require('bn.js');

const AbiBinProvider = require('../AbiBinProvider');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');
const Anchor = require('../ContractInteract/Anchor');
const EIP20Token = require('../ContractInteract/EIP20Token');
const {
  validateConfigExists,
  validateConfigKeyExists,
} = require('./validation');

const ContractName = 'EIP20CoGateway';
/**
 * Contract interact for EIP20CoGateway.
 */
class EIP20CoGateway {
  /**
   * Constructor for EIP20CoGateway.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} coGatewayAddress EIP20CoGateway contract address.
   */
  constructor(web3, coGatewayAddress) {
    if (web3 instanceof Web3) {
      this.web3 = web3;
    } else {
      const err = new TypeError(
        "Mandatory Parameter 'web3' is missing or invalid",
      );
      throw err;
    }

    if (!Web3.utils.isAddress(coGatewayAddress)) {
      const err = new TypeError(
        "Mandatory Parameter 'coGatewayAddress' is missing or invalid.",
      );
      throw err;
    }

    this.address = coGatewayAddress;

    this.contract = Contracts.getEIP20CoGateway(this.web3, this.address);

    if (!this.contract) {
      const err = new Error(
        `Could not load EIP20CoGateway contract for: ${this.address}`,
      );
      throw err;
    }

    this.proveGateway = this.proveGateway.bind(this);
    this.proveGatewayRawTx = this.proveGatewayRawTx.bind(this);
    this.confirmStakeIntent = this.confirmStakeIntent.bind(this);
    this.confirmStakeIntentRawTx = this.confirmStakeIntentRawTx.bind(this);
    this.progressMint = this.progressMint.bind(this);
    this.progressMintRawTx = this.progressMintRawTx.bind(this);
    this.getBounty = this.getBounty.bind(this);
    this.getNonce = this.getNonce.bind(this);
    this.getStateRootProviderAddress = this.getStateRootProviderAddress.bind(
      this,
    );
    this.getInboxMessageStatus = this.getInboxMessageStatus.bind(this);
    this.getOutboxMessageStatus = this.getOutboxMessageStatus.bind(this);
    this.getAnchor = this.getAnchor.bind(this);
    this.getLatestAnchorInfo = this.getLatestAnchorInfo.bind(this);
    this.getUtilityTokenContract = this.getUtilityTokenContract.bind(this);
    this.getUtilityToken = this.getUtilityToken.bind(this);
    this.isRedeemAmountApproved = this.isRedeemAmountApproved.bind(this);
    this.redeem = this.redeem.bind(this);
    this.redeemRawTx = this.redeemRawTx.bind(this);
    this.progressRedeemRawTx = this.progressRedeemRawTx.bind(this);
    this.approveRedeemAmount = this.approveRedeemAmount.bind(this);
    this.progressRedeem = this.progressRedeem.bind(this);
  }

  // TODO: docs
  static setup(web3, config, txOptions = {}) {
    EIP20CoGateway.validateSetupConfig(config);
    validateConfigKeyExists(config, 'gateway', 'config');

    const deployParams = Object.assign({}, txOptions);
    deployParams.from = txOptions.from || config.deployer;

    return EIP20CoGateway.deploy(
      web3,
      config.valueToken, // TODO: valueToken -> baseToken
      config.utilityToken,
      config.anchor,
      config.bounty,
      config.organization,
      config.gateway,
      config.burner,
      config.messageBus,
      config.gatewayLib,
      deployParams,
    );
  }

  // TODO: docs
  static validateSetupConfig(config) {
    validateConfigExists(config);
    validateConfigKeyExists(config, 'deployer', 'config');
    validateConfigKeyExists(config, 'bounty', 'config');
    validateConfigKeyExists(config, 'organization', 'config');
    validateConfigKeyExists(config, 'anchor', 'config');
    validateConfigKeyExists(config, 'messageBus', 'config');
    validateConfigKeyExists(config, 'gatewayLib', 'config');
    validateConfigKeyExists(config, 'valueToken', 'config');
    validateConfigKeyExists(config, 'utilityToken', 'config');
    validateConfigKeyExists(config, 'burner', 'config');
  }

  // TODO: docs
  static async deploy(
    web3,
    valueToken,
    utilityToken,
    anchor,
    bounty,
    organization,
    gateway,
    burner,
    messageBus,
    gatewayLib,
    txOptions,
  ) {
    const tx = EIP20CoGateway.deployRawTx(
      web3,
      valueToken,
      utilityToken,
      anchor,
      bounty,
      organization,
      gateway,
      burner,
      messageBus,
      gatewayLib,
    );

    const _txOptions = txOptions;
    if (!_txOptions.gas) {
      _txOptions.gas = await tx.estimateGas();
    }

    return Utils.sendTransaction(tx, _txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new EIP20CoGateway(web3, address);
    });
  }

  // TODO: docs
  static deployRawTx(
    web3,
    valueToken,
    utilityToken,
    anchor,
    bounty,
    organization,
    gateway,
    burner,
    messageBus,
    gatewayLib,
  ) {
    const messageBusLibInfo = {
      address: messageBus,
      name: 'MessageBus',
    };
    const gatewayLibInfo = {
      address: gatewayLib,
      name: 'GatewayLib',
    };

    const abiBinProvider = new AbiBinProvider();
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getLinkedBIN(
      ContractName,
      messageBusLibInfo,
      gatewayLibInfo,
    );

    const contract = new web3.eth.Contract(abi, null, null);
    const args = [
      valueToken,
      utilityToken,
      anchor,
      bounty,
      organization,
      gateway,
      burner,
    ];

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }

  /**
   * Prove gateway contract account address on auxiliary chain.
   *
   * @param {string} blockHeight Block number.
   * @param {string} encodedAccount Encoded account data.
   * @param {string} accountProof Account proof data.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  proveGateway(blockHeight, encodedAccount, accountProof, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid from address ${txOptions.from} in transaction options.`,
      );
      return Promise.reject(err);
    }
    return this.proveGatewayRawTx(
      blockHeight,
      encodedAccount,
      accountProof,
    ).then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Get raw transaction object for prove Gateway contract.
   *
   * @param {string} blockHeight Block number.
   * @param {string} encodedAccount Encoded account data.
   * @param {string} accountProof Account proof data.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  proveGatewayRawTx(blockHeight, encodedAccount, accountProof) {
    if (typeof blockHeight !== 'string') {
      const err = new TypeError(`Invalid block height: ${blockHeight}.`);
      return Promise.reject(err);
    }

    if (typeof encodedAccount !== 'string') {
      const err = new TypeError(`Invalid account data: ${encodedAccount}.`);
      return Promise.reject(err);
    }

    if (typeof accountProof !== 'string') {
      const err = new TypeError(`Invalid account proof: ${accountProof}.`);
      return Promise.reject(err);
    }

    const tx = this.contract.methods.proveGateway(
      blockHeight,
      encodedAccount,
      accountProof,
    );
    return Promise.resolve(tx);
  }

  /**
   * Performs confirm stake intent.
   *
   * @param {string} staker Staker address.
   * @param {string} nonce Staker nonce.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} amount Amount to stake.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} hashLock Hash lock.
   * @param {string} blockHeight Block number.
   * @param {string} storageProof Storage proof.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  confirmStakeIntent(
    staker,
    nonce,
    beneficiary,
    amount,
    gasPrice,
    gasLimit,
    hashLock,
    blockHeight,
    storageProof,
    txOptions,
  ) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid from address ${txOptions.from} in transaction options.`,
      );
      return Promise.reject(err);
    }

    return this.confirmStakeIntentRawTx(
      staker,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      storageProof,
    ).then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Get the raw transaction for confirm stake intent.
   *
   * @param {string} staker Staker address.
   * @param {string} nonce Staker nonce.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} amount Amount to stake.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} hashLock Hash lock.
   * @param {string} blockHeight Block number.
   * @param {string} storageProof Storage proof.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  confirmStakeIntentRawTx(
    staker,
    nonce,
    beneficiary,
    amount,
    gasPrice,
    gasLimit,
    hashLock,
    blockHeight,
    storageProof,
  ) {
    if (!Web3.utils.isAddress(staker)) {
      const err = new TypeError(`Invalid staker address: ${staker}.`);
      return Promise.reject(err);
    }

    if (typeof nonce !== 'string') {
      const err = new TypeError(`Invalid nonce: ${nonce}.`);
      return Promise.reject(err);
    }

    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError(
        `Invalid beneficiary address: ${beneficiary}.`,
      );
      return Promise.reject(err);
    }

    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid stake amount: ${amount}.`);
      return Promise.reject(err);
    }

    if (typeof gasPrice !== 'string') {
      const err = new TypeError(`Invalid gas price: ${gasPrice}.`);
      return Promise.reject(err);
    }

    if (typeof gasLimit !== 'string') {
      const err = new TypeError(`Invalid gas limit: ${gasLimit}.`);
      return Promise.reject(err);
    }

    if (typeof blockHeight !== 'string') {
      const err = new TypeError(`Invalid block height: ${blockHeight}.`);
      return Promise.reject(err);
    }

    if (typeof hashLock !== 'string') {
      const err = new TypeError(`Invalid hash lock: ${hashLock}.`);
      return Promise.reject(err);
    }

    if (typeof storageProof !== 'string') {
      const err = new TypeError(
        `Invalid storage proof data: ${storageProof}.`,
      );
      return Promise.reject(err);
    }

    const tx = this.contract.methods.confirmStakeIntent(
      staker,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      hashLock,
      blockHeight,
      storageProof,
    );
    return Promise.resolve(tx);
  }

  /**
   * Performs progress mint.
   *
   * @param {string} messageHash Hash to identify mint message.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  progressMint(messageHash, unlockSecret, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid from address ${txOptions.from} in transaction options.`,
      );
      return Promise.reject(err);
    }
    return this.progressMintRawTx(messageHash, unlockSecret).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get the raw transaction for progress mint.
   *
   * @param {string} messageHash Hash to identify mint message.
   * @param {string} unlockSecret Unlock secret.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  progressMintRawTx(messageHash, unlockSecret) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError(`Invalid message hash: ${messageHash}.`);
      return Promise.reject(err);
    }

    if (typeof unlockSecret !== 'string') {
      const err = new TypeError(`Invalid unlock secret: ${unlockSecret}.`);
      return Promise.reject(err);
    }

    const tx = this.contract.methods.progressMint(messageHash, unlockSecret);
    return Promise.resolve(tx);
  }

  /**
   * Performs progress redeem.
   *
   * @param {string} messageHash Hash to identify redeem message.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  progressRedeem(messageHash, unlockSecret, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid from address ${txOptions.from} in transaction options.`,
      );
      return Promise.reject(err);
    }
    return this.progressRedeemRawTx(messageHash, unlockSecret).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get the raw transaction for progress redeem.
   *
   * @param {string} messageHash Hash to identify redeem message.
   * @param {string} unlockSecret Unlock secret.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  progressRedeemRawTx(messageHash, unlockSecret) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError(`Invalid message hash: ${messageHash}.`);
      return Promise.reject(err);
    }

    if (typeof unlockSecret !== 'string') {
      const err = new TypeError(`Invalid unlock secret: ${unlockSecret}.`);
      return Promise.reject(err);
    }

    const tx = this.contract.methods.progressRedeem(messageHash, unlockSecret);
    return Promise.resolve(tx);
  }

  /**
   * Return the bounty amount.
   *
   * @returns {Promise<string>} Promise that resolves to bounty amount.
   */
  getBounty() {
    if (this._bountyAmount) {
      return Promise.resolve(this._bountyAmount);
    }
    return this.contract.methods
      .bounty()
      .call()
      .then((bounty) => {
        this._bountyAmount = bounty;
        return bounty;
      });
  }

  /**
   * Returns the utility token address.
   *
   * @returns {Promise<string>} Promise that resolves to utility token contract address.
   */
  getUtilityToken() {
    if (this._utilityToken) {
      return Promise.resolve(this._utilityToken);
    }
    return this.contract.methods
      .utilityToken()
      .call()
      .then((utilityToken) => {
        this._utilityToken = utilityToken;
        return utilityToken;
      });
  }

  /**
   * Returns the nonce for the given account address.
   *
   * @param {string} accountAddress Account address for which the nonce is to be fetched.
   *
   * @returns {Promise<Object>} Promise that resolves to nonce
   */
  getNonce(accountAddress) {
    if (!Web3.utils.isAddress(accountAddress)) {
      throw new TypeError(`Invalid account address: ${accountAddress}.`);
    }
    return this.contract.methods.getNonce(accountAddress).call();
  }

  /**
   * Returns the state root provider contract address.
   *
   * @returns {Promise<Object>} Promise that resolves to state root provider contract's address.
   */
  async getStateRootProviderAddress() {
    if (this._stateRootProviderAddress) {
      return Promise.resolve(this._stateRootProviderAddress);
    }
    return this.contract.methods
      .stateRootProvider()
      .call()
      .then((stateRootProviderAddress) => {
        this._stateRootProviderAddress = stateRootProviderAddress;
        return stateRootProviderAddress;
      });
  }

  /**
   * Returns inbox message status.
   *
   * @param {string} messageHash Message hash.
   *
   * @returns {Promise<Object>} Promise that resolves to message status.
   */
  getInboxMessageStatus(messageHash) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError(`Invalid message hash: ${messageHash}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.getInboxMessageStatus(messageHash).call();
  }

  /**
   * Returns outbox message status.
   *
   * @param {string} messageHash Message hash.
   *
   * @returns {Promise<Object>} Promise that resolves to message status.
   */
  getOutboxMessageStatus(messageHash) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError(`Invalid message hash: ${messageHash}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.getOutboxMessageStatus(messageHash).call();
  }

  /**
   * Performs redeem.
   *
   * @param {string} amount Amount to redeem.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Redeemer's nonce.
   * @param {string} hashLock Hash lock.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  redeem(amount, beneficiary, gasPrice, gasLimit, nonce, hashLock, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid redeemer address: ${txOptions.from}.`,
      );
      return Promise.reject(err);
    }

    return this.redeemRawTx(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    ).then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Get the raw transaction for redeem.
   *
   * @param {string} amount Amount to redeem.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Redeemer's nonce.
   * @param {string} hashLock Hash lock.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  redeemRawTx(amount, beneficiary, gasPrice, gasLimit, nonce, hashLock) {
    if (!new BN(amount).gtn(0)) {
      const err = new TypeError(
        `Redeem amount must be greater than zero: ${amount}.`,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError(
        `Invalid beneficiary address: ${beneficiary}.`,
      );
      return Promise.reject(err);
    }
    if (typeof gasPrice !== 'string') {
      const err = new TypeError(`Invalid gas price: ${gasPrice}.`);
      return Promise.reject(err);
    }
    if (typeof gasLimit !== 'string') {
      const err = new TypeError(`Invalid gas limit: ${gasLimit}.`);
      return Promise.reject(err);
    }
    if (typeof nonce !== 'string') {
      const err = new TypeError(`Invalid nonce: ${nonce}.`);
      return Promise.reject(err);
    }
    if (typeof hashLock !== 'string') {
      const err = new TypeError(`Invalid hash lock: ${hashLock}.`);
      return Promise.reject(err);
    }
    const tx = this.contract.methods.redeem(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    );
    return Promise.resolve(tx);
  }

  /**
   * Check if the account has approved CoGateway contract for redeem amount transfer.
   *
   * @param {string} redmeer Redeemer account address.
   * @param {string} amount Approval amount.
   *
   * @returns {Promise<boolean>} Promise that resolves to `true` if approved.
   */
  isRedeemAmountApproved(redeemer, amount) {
    if (!Web3.utils.isAddress(redeemer)) {
      const err = new TypeError(`Invalid redeemer address: ${redeemer}.`);
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid redeem amount: ${amount}.`);
      return Promise.reject(err);
    }
    return this.getUtilityTokenContract().then((eip20ValueToken) => {
      return eip20ValueToken.isAmountApproved(redeemer, this.address, amount);
    });
  }

  /**
   * Approves CoGateway contract address for the amount transfer.
   *
   * @param {string} amount Approve amount.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  approveRedeemAmount(amount, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid redeem amount: ${amount}.`);
      return Promise.reject(err);
    }
    return this.getUtilityTokenContract().then((eip20Token) => {
      return eip20Token.approve(this.address, amount, txOptions);
    });
  }

  /**
   * Returns Anchor object.
   *
   * @returns {Promise<string>} Promise object that resolves to anchor contract address.
   */
  getAnchor() {
    if (this._anchor) {
      return Promise.resolve(this._anchor);
    }
    return this.getStateRootProviderAddress().then((anchorAddress) => {
      const anchor = new Anchor(this.web3, anchorAddress);
      this._anchor = anchor;
      return anchor;
    });
  }

  /**
   * Get the latest state root and block height.
   *
   * @returns {Promise<Object>} Promise object that resolves to object containing state root and block height.
   */
  async getLatestAnchorInfo() {
    return this.getAnchor().then((anchor) => anchor.getLatestInfo());
  }

  /**
   * Returns utility token object.
   *
   * @returns {Promise<Object>} Promise that resolves to utility token object.
   */
  getUtilityTokenContract() {
    if (this._eip20UtilityToken) {
      return Promise.resolve(this._eip20UtilityToken);
    }
    return this.getUtilityToken().then((utilityToken) => {
      const token = new EIP20Token(this.web3, utilityToken);
      this._eip20UtilityToken = token;
      return token;
    });
  }
}

module.exports = EIP20CoGateway;
