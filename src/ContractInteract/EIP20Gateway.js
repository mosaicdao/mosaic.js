'use strict';

const Web3 = require('web3');
const BN = require('bn.js');

const AbiBinProvider = require('../AbiBinProvider');
const Contracts = require('../Contracts');
const Utils = require('../utils/Utils');
const EIP20CoGateway = require('./EIP20CoGateway');
const EIP20Token = require('./EIP20Token');
const Anchor = require('./Anchor');
const { validateConfigKeyExists } = require('./validation');

const ContractName = 'EIP20Gateway';

/**
 * Contract interact for EIP20Gateway.
 */
class EIP20Gateway {
  /**
   * Constructor for EIP20Gateway.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} gatewayAddress Gateway contract address.
   */
  constructor(web3, gatewayAddress) {
    if (web3 instanceof Web3) {
      this.web3 = web3;
    } else {
      const err = new TypeError(
        "Mandatory Parameter 'web3' is missing or invalid",
      );
      throw err;
    }

    if (!Web3.utils.isAddress(gatewayAddress)) {
      const err = new TypeError(
        "Mandatory Parameter 'gatewayAddress' is missing or invalid.",
      );
      throw err;
    }

    this.address = gatewayAddress;

    this.contract = Contracts.getEIP20Gateway(this.web3, this.address);

    if (!this.contract) {
      const err = new Error(
        `Could not load EIP20Gateway contract for: ${this.address}`,
      );
      throw err;
    }

    this.proveGateway = this.proveGateway.bind(this);
    this.proveGatewayRawTx = this.proveGatewayRawTx.bind(this);
    this.stake = this.stake.bind(this);
    this.stakeRawTx = this.stakeRawTx.bind(this);
    this.progressStake = this.progressStake.bind(this);
    this.progressStakeRawTx = this.progressStakeRawTx.bind(this);
    this.getBounty = this.getBounty.bind(this);
    this.getBaseToken = this.getBaseToken.bind(this);
    this.getValueToken = this.getValueToken.bind(this);
    this.getNonce = this.getNonce.bind(this);
    this.getStateRootProviderAddress = this.getStateRootProviderAddress.bind(
      this,
    );
    this.getInboxMessageStatus = this.getInboxMessageStatus.bind(this);
    this.getOutboxMessageStatus = this.getOutboxMessageStatus.bind(this);
    this.approveStakeAmount = this.approveStakeAmount.bind(this);
    this.approveBountyAmount = this.approveBountyAmount.bind(this);
    this.getAnchor = this.getAnchor.bind(this);
    this.getLatestAnchorInfo = this.getLatestAnchorInfo.bind(this);
    this.getBaseTokenContract = this.getBaseTokenContract.bind(this);
    this.getValueTokenContract = this.getValueTokenContract.bind(this);
    this.isBountyAmountApproved = this.isBountyAmountApproved.bind(this);
    this.isStakeAmountApproved = this.isStakeAmountApproved.bind(this);
    this.getStakeVault = this.getStakeVault.bind(this);
    this.activateGateway = this.activateGateway.bind(this);
    this.activateGatewayRawTx = this.activateGatewayRawTx.bind(this);
  }

  /*
  //gatewayConfig
  {
    "deployer": "0x...",
    "organization": "0x...",
    "anchor": "0x....",
    "bounty": "123456",
    "messageBus": "0x....",
    "gatewayLib": "0x....",
    "simpleToken": "0x....",
    "organizationOwner": "0x....",
  }
  //coGatewayConfig
  {
    "deployer": "0x...",
    "token": "0x...",
    "baseToken": "0x...",
    "organization": "0x...",
    "anchor": "0x....",
    "bounty": "123456",
    "messageBus": "0x....",
    "gatewayLib": "0x....",
    "ostPrime": "0x...."
  }
*/

  // TODO: docs
  static setup(
    originWeb3,
    auxiliaryWeb3,
    gatewayConfig,
    coGatewayConfig,
    gatewayTxOptions = {},
    coGatewayTxOptions = {},
  ) {
    if (!gatewayConfig) {
      throw new Error('Mandatory parameter "gatewayConfig" missing. ');
    }
    if (!coGatewayConfig) {
      throw new Error('Mandatory parameter "coGatewayConfig" missing. ');
    }

    gatewayConfig = gatewayConfig || {};
    gatewayConfig.messageBus = gatewayConfig.messageBus || this.messageBus;
    gatewayConfig.gatewayLib = gatewayConfig.gatewayLib || this.gatewayLib;

    if (!originWeb3) {
      throw new Error('Mandatory parameter "originWeb3" missing.');
    }

    if (!auxiliaryWeb3) {
      throw new Error('Mandatory parameter "auxiliaryWeb3" missing.');
    }

    if (!gatewayConfig.baseToken) {
      throw new Error(
        'Mandatory configuration "baseToken" missing. Set gatewayConfig.baseToken address',
      );
    }

    EIP20Gateway.validateSetupConfig(gatewayConfig);
    EIP20CoGateway.validateSetupConfig(coGatewayConfig);

    const gatewayDeployParams = Object.assign({}, gatewayTxOptions);
    gatewayDeployParams.from = gatewayConfig.deployer;

    let gatewayDeploy = EIP20Gateway.deploy(
      originWeb3,
      gatewayConfig.token,
      gatewayConfig.baseToken,
      gatewayConfig.anchor,
      gatewayConfig.bounty,
      gatewayConfig.organization,
      gatewayConfig.burner,
      gatewayConfig.messageBus,
      gatewayConfig.gatewayLib,
      gatewayDeployParams,
    );

    const coGatewayDeploy = gatewayDeploy.then((gateway) => {
      const gatewayAddress = gateway.address;
      coGatewayConfig.gateway = gatewayAddress;

      return EIP20CoGateway.setup(
        auxiliaryWeb3,
        coGatewayConfig,
        coGatewayTxOptions,
      );
    });

    const gatewayActivation = Promise.all([
      gatewayDeploy,
      coGatewayDeploy,
    ]).then(([gateway, coGateway]) => {
      const ownerTxParams = Object.assign({}, gatewayDeployParams);
      ownerTxParams.from = gatewayConfig.organizationOwner;

      const coGatewayAddress = coGateway.address;

      return gateway
        .activateGateway(coGatewayAddress, ownerTxParams)
        .then(() => gateway);
    });

    return gatewayActivation;
  }

  // TODO: docs
  static validateSetupConfig(gatewayConfig) {
    validateConfigKeyExists(gatewayConfig, 'deployer', 'gatewayConfig');
    validateConfigKeyExists(gatewayConfig, 'organization', 'gatewayConfig');
    validateConfigKeyExists(gatewayConfig, 'anchor', 'gatewayConfig');
    validateConfigKeyExists(gatewayConfig, 'bounty', 'gatewayConfig');
    validateConfigKeyExists(gatewayConfig, 'burner', 'gatewayConfig');
    validateConfigKeyExists(gatewayConfig, 'messageBus', 'gatewayConfig');
    validateConfigKeyExists(gatewayConfig, 'gatewayLib', 'gatewayConfig');
    validateConfigKeyExists(gatewayConfig, 'token', 'gatewayConfig');
    validateConfigKeyExists(
      gatewayConfig,
      'organizationOwner',
      'gatewayConfig',
    );
  }

  // TODO: docs
  static async deploy(
    web3,
    token,
    baseToken,
    anchor,
    bounty,
    membersManager,
    burner,
    messageBusAddress,
    gatewayLibAddress,
    txOptions,
  ) {
    const tx = EIP20Gateway.deployRawTx(
      web3,
      token,
      baseToken,
      anchor,
      bounty,
      membersManager,
      burner,
      messageBusAddress,
      gatewayLibAddress,
    );

    const _txOptions = txOptions;
    if (!_txOptions.gas) {
      _txOptions.gas = await tx.estimateGas();
    }

    return Utils.sendTransaction(tx, _txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new EIP20Gateway(web3, address);
    });
  }

  // TODO: docs
  static deployRawTx(
    web3,
    token,
    baseToken,
    anchor,
    bounty,
    membersManager,
    burner,
    messageBusAddress,
    gatewayLibAddress,
  ) {
    const messageBusLibInfo = {
      address: messageBusAddress,
      name: 'MessageBus',
    };
    const gatewayLibInfo = {
      address: gatewayLibAddress,
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
    const args = [token, baseToken, anchor, bounty, membersManager, burner];

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }

  /**
   * Prove CoGateway contract account address on origin chain.
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
   * Get raw transaction object for prove CoGateway contract.
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
   * Performs stake.
   *
   * @param {string} amount Amount to stake.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce.
   * @param {string} hashLock Hash lock.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  stake(amount, beneficiary, gasPrice, gasLimit, nonce, hashLock, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(
        `Invalid facilitator address: ${txOptions.from}.`,
      );
      return Promise.reject(err);
    }

    return this.stakeRawTx(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    ).then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Get the raw transaction for stake.
   *
   * @param {string} amount Amount to stake.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce.
   * @param {string} hashLock Hash lock.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  stakeRawTx(amount, beneficiary, gasPrice, gasLimit, nonce, hashLock) {
    if (!new BN(amount).gtn(0)) {
      const err = new TypeError(
        `Stake amount must be greater than zero: ${amount}.`,
      );
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(beneficiary)) {
      const err = new TypeError(
        `Invalid beneficiary address: ${beneficiary}.`,
      );
      return Promise.reject(err);
    }
    if (gasPrice === undefined) {
      const err = new TypeError(`Invalid gas price: ${gasPrice}.`);
      return Promise.reject(err);
    }
    if (gasLimit === undefined) {
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
    const tx = this.contract.methods.stake(
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
   * Performs progress stake.
   *
   * @param {string} messageHash Hash to identify stake message.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  progressStake(messageHash, unlockSecret, txOptions) {
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
    return this.progressStakeRawTx(messageHash, unlockSecret).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get the raw transaction for progress stake
   *
   * @param {string} messageHash Hash to identify stake message.
   * @param {string} unlockSecret Unlock secret.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  progressStakeRawTx(messageHash, unlockSecret) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError(`Invalid message hash: ${messageHash}.`);
      return Promise.reject(err);
    }

    if (typeof unlockSecret !== 'string') {
      const err = new TypeError(`Invalid unlock secret: ${unlockSecret}.`);
      return Promise.reject(err);
    }

    const tx = this.contract.methods.progressStake(messageHash, unlockSecret);
    return Promise.resolve(tx);
  }

  /**
   * Confirm redeem intent
   *
   * @param {string} redeemer Redeemer address.
   * @param {string} nonce Redeemer nonce.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} amount Redeem amount.
   * @param {string} gasPrice Gas price that redeemer is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} blockNumber Block number.
   * @param {string} hashLock Hash lock.
   * @param {string} storageProof Storage proof.
   * @param {Object} txOptions Transaction option.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  confirmRedeemIntent(
    redeemer,
    nonce,
    beneficiary,
    amount,
    gasPrice,
    gasLimit,
    blockNumber,
    hashLock,
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
    return this.confirmRedeemIntentRawTx(
      redeemer,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      blockNumber,
      hashLock,
      storageProof,
    ).then((tx) => Utils.sendTransaction(tx, txOptions));
  }

  /**
   * Get confirm redeem intent raw transaction object
   *
   * @param {string} redeemer Redeemer address.
   * @param {string} nonce Redeemer nonce.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} amount Redeem amount.
   * @param {string} gasPrice Gas price that redeemer is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} blockHeight Block height.
   * @param {string} hashLock Hash lock.
   * @param {string} storageProof Storage proof.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  confirmRedeemIntentRawTx(
    redeemer,
    nonce,
    beneficiary,
    amount,
    gasPrice,
    gasLimit,
    blockHeight,
    hashLock,
    storageProof,
  ) {
    if (!Web3.utils.isAddress(redeemer)) {
      const err = new TypeError(`Invalid redeemer address: ${redeemer}.`);
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
      const err = new TypeError(`Invalid redeem amount: ${amount}.`);
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

    const tx = this.contract.methods.confirmRedeemIntent(
      redeemer,
      nonce,
      beneficiary,
      amount,
      gasPrice,
      gasLimit,
      blockHeight,
      hashLock,
      storageProof,
    );
    return Promise.resolve(tx);
  }

  /**
   * Performs progress unstake.
   *
   * @param {string} messageHash Hash to identify unstake message.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  progressUnstake(messageHash, unlockSecret, txOptions) {
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
    return this.progressUnstakeRawTx(messageHash, unlockSecret).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  /**
   * Get the raw transaction for progress unstake.
   *
   * @param {string} messageHash Hash to identify unstake message.
   * @param {string} unlockSecret Unlock secret.
   *
   * @returns {Promise<Object>} Promise that resolves to raw transaction object.
   */
  progressUnstakeRawTx(messageHash, unlockSecret) {
    if (typeof messageHash !== 'string') {
      const err = new TypeError(`Invalid message hash: ${messageHash}.`);
      return Promise.reject(err);
    }

    if (typeof unlockSecret !== 'string') {
      const err = new TypeError(`Invalid unlock secret: ${unlockSecret}.`);
      return Promise.reject(err);
    }

    const tx = this.contract.methods.progressUnstake(
      messageHash,
      unlockSecret,
    );
    return Promise.resolve(tx);
  }

  /**
   * Returns the bounty amount.
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
   * Returns the ERC20 base token address.
   *
   * @returns {Promise<string>} Promise that resolves to base token contract address.
   */
  getBaseToken() {
    if (this._baseTokenAddress) {
      return Promise.resolve(this._baseTokenAddress);
    }
    return this.contract.methods
      .baseToken()
      .call()
      .then((baseToken) => {
        this._baseTokenAddress = baseToken;
        return baseToken;
      });
  }

  /**
   * Returns the EIP20 token address.
   *
   * @returns {Promise<string>} Promise that resolves to value token contract address.
   */
  getValueToken() {
    if (this._valueTokenAddress) {
      return Promise.resolve(this._valueTokenAddress);
    }
    return this.contract.methods
      .token()
      .call()
      .then((token) => {
        this._valueTokenAddress = token;
        return token;
      });
  }

  /**
   * Returns the nonce for the given account address.
   *
   * @param {string} accountAddress Account address for which the nonce is to be fetched.
   *
   *  @returns {Promise<Object>} Promise that resolves to nonce
   */
  getNonce(accountAddress) {
    if (!Web3.utils.isAddress(accountAddress)) {
      const err = TypeError(`Invalid account address: ${accountAddress}.`);
      return Promise.reject(err);
    }
    return this.contract.methods.getNonce(accountAddress).call();
  }

  /**
   * Returns the origin chain state root provider contract address.
   *
   * @returns {Promise<Object>} Promise that resolves to state root provider contract's address.
   */
  getStateRootProviderAddress() {
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
   * Check if the account has approved gateway contract for stake amount transfer.
   *
   * @param {string} stakerAddress Staker account address.
   * @param {string} amount Approval amount.
   *
   * @returns {Promise<boolean>} Promise that resolves to `true` if approved.
   */
  isStakeAmountApproved(stakerAddress, amount) {
    if (!Web3.utils.isAddress(stakerAddress)) {
      const err = new TypeError(`Invalid staker address: ${stakerAddress}.`);
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid stake amount: ${amount}.`);
      return Promise.reject(err);
    }
    return this.getValueTokenContract().then((eip20ValueToken) => {
      return eip20ValueToken.isAmountApproved(
        stakerAddress,
        this.gatewayAddress,
        amount,
      );
    });
  }

  /**
   * Check if the account has approved gateway contract for bounty amount transfer.
   *
   * @param {string} facilityAddress Facilitator address.
   *
   * @returns {Promise<boolean>} Promise that resolves to `true` if approved.
   */
  isBountyAmountApproved(facilityAddress) {
    if (!Web3.utils.isAddress(facilityAddress)) {
      const err = new TypeError(
        `Invalid facilitator address: ${facilityAddress}.`,
      );
      return Promise.reject(err);
    }
    return this.getBaseTokenContract().then((eip20BaseToken) => {
      return this.getBounty().then((bounty) => {
        return eip20BaseToken.isAmountApproved(
          facilityAddress,
          this.gatewayAddress,
          bounty,
        );
      });
    });
  }

  /**
   * Returns value token object.
   *
   * @returns {Promise<Object>} Promise that resolves to EIP20Token object.
   */
  getValueTokenContract() {
    if (this._eip20ValueToken) {
      return Promise.resolve(this._eip20ValueToken);
    }
    return this.getValueToken().then((valueTokenAddress) => {
      const token = new EIP20Token(this.web3, valueTokenAddress);
      this._eip20ValueToken = token;
      return token;
    });
  }

  /**
   * Returns base token object.
   *
   * @returns {Promise<Object>} Promise that resolves to EIP20Token object.
   */
  getBaseTokenContract() {
    if (this._eip20BaseToken) {
      return Promise.resolve(this._eip20BaseToken);
    }
    return this.getBaseToken().then((baseTokenAddress) => {
      const token = new EIP20Token(this.web3, baseTokenAddress);
      this._eip20BaseToken = token;
      return token;
    });
  }

  /**
   * Approves gateway contract address for the amount transfer.
   *
   * @param {string} amount Approve amount.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  approveStakeAmount(amount, txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    if (typeof amount !== 'string') {
      const err = new TypeError(`Invalid stake amount: ${amount}.`);
      return Promise.reject(err);
    }
    return this.getValueTokenContract().then((eip20Token) =>
      eip20Token.approve(this.gatewayAddress, amount, txOptions),
    );
  }

  /**
   * Approves Gateway contract address for the amount transfer.
   *
   * @param {string} amount Approve amount.
   * @param {string} txOptions Transaction options.
   *
   * @returns {Promise<Object>} Promise that resolves to transaction receipt.
   */
  approveBountyAmount(txOptions) {
    if (!txOptions) {
      const err = new TypeError(`Invalid transaction options: ${txOptions}.`);
      return Promise.reject(err);
    }
    if (!Web3.utils.isAddress(txOptions.from)) {
      const err = new TypeError(`Invalid from address: ${txOptions.from}.`);
      return Promise.reject(err);
    }
    return this.getBaseTokenContract().then((eip20BaseToken) => {
      return this.getBounty().then((bounty) =>
        eip20BaseToken.approve(this.gatewayAddress, bounty, txOptions),
      );
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

  // TODO
  getStakeVault() {
    return this.contract.methods.stakeVault().call();
  }

  // TODO
  activateGateway(coGatewayAddress, txOptions) {
    if (!txOptions) {
      const err = new TypeError('Invalid transaction options.');
      return Promise.reject(err);
    }

    return this.activateGatewayRawTx(coGatewayAddress).then((tx) =>
      Utils.sendTransaction(tx, txOptions),
    );
  }

  // TODO
  activateGatewayRawTx(coGatewayAddress) {
    if (!Web3.utils.isAddress(coGatewayAddress)) {
      const err = new TypeError('Invalid coGateway address.');
      return Promise.reject(err);
    }

    const tx = this.contract.methods.activateGateway(coGatewayAddress);
    return Promise.resolve(tx);
  }
}

module.exports = EIP20Gateway;
