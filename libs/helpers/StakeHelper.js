// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

const Web3 = require('web3');
const BN = require('bn.js');
const Contracts = require('../../libs/Contracts');
const Utils = require('../utils/Utils.js');

/**
 * Class for stake helper methods
 */
class StakeHelper {
  /**
   * Constructor for stake helper.
   *
   * @param {Object} originWeb3 Origin chain web3 object.
   * @param {Object} auxiliaryWeb3 Auxiliary chain web3 object.
   * @param {string} Gateway contract address.
   * @param {string} CoGateway contract address.
   */
  constructor(originWeb3, auxiliaryWeb3, gatewayAddress, coGatewayAddress) {
    if (originWeb3 === undefined) {
      throw new Error('Invalid origin web3 object.');
    }

    if (auxiliaryWeb3 === undefined) {
      throw new Error('Invalid auxiliary web3 object.');
    }

    if (!Web3.utils.isAddress(gatewayAddress)) {
      throw new Error('Invalid Gateway address.');
    }

    if (!Web3.utils.isAddress(coGatewayAddress)) {
      throw new Error('Invalid Cogateway address.');
    }

    this.originWeb3 = originWeb3;
    this.auxiliaryWeb3 = auxiliaryWeb3;
    this.gatewayAddress = gatewayAddress;
    this.coGatewayAddress = coGatewayAddress;

    this.getBounty = this.getBounty.bind(this);
    this.getBaseToken = this.getBaseToken.bind(this);
    this.getValueToken = this.getValueToken.bind(this);
    this.getNonce = this.getNonce.bind(this);
    this.getCoGatewayStateRootProvider = this.getCoGatewayStateRootProvider.bind(
      this,
    );
    this.getLatestStateRootBlockHeight = this.getLatestStateRootBlockHeight.bind(
      this,
    );
    this.getMintStatus = this.getMintStatus.bind(this);
    this.approveBountyAmount = this.approveBountyAmount.bind(this);
    this.approveStakeAmount = this.approveStakeAmount.bind(this);
    this.isStakeAmountApproved = this.isStakeAmountApproved.bind(this);
    this.isBountyAmountApproved = this.isBountyAmountApproved.bind(this);
    this.stake = this.stake.bind(this);
    this._getNonce = this._getNonce.bind(this);
    this._approveStakeAmountRawTx = this._approveStakeAmountRawTx.bind(this);
    this._stakeRawTx = this._stakeRawTx.bind(this);
  }

  /**
   * Returns the bounty amount from EIP20Gateway contract.
   *
   * @returns {Promise} Promise object represents the bounty.
   */
  getBounty() {
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
   * Returns the ERC20 base token address.
   *
   * @returns {Promise} Promise object represents ERC20 base token address.
   */
  async getBaseToken() {
    if (this.baseTokenAddress) {
      return Promise.resolve(this.baseTokenAddress);
    }

    const gatewayContract = Contracts.getEIP20Gateway(
      this.originWeb3,
      this.gatewayAddress,
    );

    return gatewayContract.methods
      .baseToken()
      .call()
      .then((baseToken) => {
        this.baseTokenAddress = baseToken;
        return baseToken;
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
      throw new Error('Invalid account address.');
    }
    return this._getNonce(staker, this.originWeb3, this.gatewayAddress);
  }

  /**
   * Returns the auxiliary chain state root provider contract address.
   *
   * @returns {Promise} Promise object represents the anchor contract address.
   */
  async getCoGatewayStateRootProvider() {
    if (this.auxiliarySRPAddress) {
      return Promise.resolve(this.auxiliarySRPAddress);
    }

    const coGatewayContract = Contracts.getEIP20CoGateway(
      this.auxiliaryWeb3,
      this.coGatewayAddress,
    );

    return coGatewayContract.methods
      .stateRootProvider()
      .call()
      .then((stateRootProviderAddress) => {
        this.auxiliarySRPAddress = stateRootProviderAddress;
        return stateRootProviderAddress;
      });
  }

  /**
   * Returns the auxiliary chain latest committed block number.
   *
   * @returns {Promise} Promise object represents the block number.
   */
  async getLatestStateRootBlockHeight() {
    const anchorAddress = await this.getCoGatewayStateRootProvider();
    const anchorContract = Contracts.getAnchor(
      this.auxiliaryWeb3,
      anchorAddress,
    );

    return anchorContract.methods
      .getLatestStateRootBlockHeight()
      .call()
      .then((blockHeight) => {
        return blockHeight;
      });
  }

  /**
   * Returns inbox message status from CoGateway contract.
   *
   * @param {string} messageHash Message hash.
   *
   * @returns {Promise} Promise object.
   */
  async getMintStatus(messageHash) {
    const coGatewayContract = Contracts.getEIP20CoGateway(
      this.auxiliaryWeb3,
      this.coGatewayAddress,
    );

    return coGatewayContract.methods
      .getInboxMessageStatus(messageHash)
      .call()
      .then((status) => {
        return status;
      });
  }

  /**
   * Returns outbox message status from gateway contract.
   *
   * @param {string} messageHash Message hash.
   *
   * @returns {Promise} Promise object.
   */
  async getStakeStatus(messageHash) {
    const gatewayContract = Contracts.getEIP20Gateway(
      this.originWeb3,
      this.gatewayAddress,
    );

    return gatewayContract.methods
      .getOutboxMessageStatus(messageHash)
      .call()
      .then((status) => {
        return status;
      });
  }

  /**
   * Approves gateway address for the bounty amount transfer.
   *
   * @param {Object} txOption Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async approveBountyAmount(txOption) {
    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }
    if (!Web3.utils.isAddress(txOption.from)) {
      throw new Error('Invalid facilitator address.');
    }
    const baseTokenAddress = await this.getBaseToken();
    const baseToken = Contracts.getEIP20Token(
      this.originWeb3,
      baseTokenAddress,
    );
    const bountyAmount = await this.getBounty();
    const tx = baseToken.methods.approve(this.gatewayAddress, bountyAmount);
    return StakeHelper.sendTransaction(tx, txOption);
  }

  /**
   * Approves gateway address for the stake amount transfer.
   *
   * @param {string} stakeAmount Stake amount.
   * @param {string} txOption Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  async approveStakeAmount(stakeAmount, txOption) {
    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }
    if (!Web3.utils.isAddress(txOption.from)) {
      throw new Error('Invalid staker address.');
    }
    const valueTokenAddress = await this.getValueToken();
    const valueToken = Contracts.getEIP20Token(
      this.originWeb3,
      valueTokenAddress,
    );
    const tx = valueToken.methods.approve(this.gatewayAddress, stakeAmount);
    return StakeHelper.sendTransaction(tx, txOption);
  }

  /**
   * Check if the staker has approved gateway contract.
   *
   * @param {string} stakerAddress Staker address.
   * @param {string} stakeAmount Stake amount.
   *
   * @returns {bool} `true` if approved.
   */
  async isStakeAmountApproved(stakerAddress, stakeAmount) {
    if (!Web3.utils.isAddress(stakerAddress)) {
      throw new Error('Invalid staker address.');
    }

    const valueTokenAddress = await this.getValueToken();
    const valueToken = Contracts.getEIP20Token(
      this.originWeb3,
      valueTokenAddress,
    );

    const approvedAllowance = await valueToken.methods
      .allowance(stakerAddress, this.gatewayAddress)
      .call();

    return new BN(stakeAmount).lte(new BN(approvedAllowance));
  }

  /**
   * Check if the facilitator has approved gateway contract.
   *
   * @param {string} facilitatorAddress Facilitator address.
   *
   * @returns {bool} `true` if approved.
   */
  async isBountyAmountApproved(facilitatorAddress) {
    if (!Web3.utils.isAddress(facilitatorAddress)) {
      throw new Error('Invalid facilitator address.');
    }

    const baseTokenAddress = await this.getBaseToken();
    const baseToken = Contracts.getEIP20Token(
      this.originWeb3,
      baseTokenAddress,
    );
    const bountyAmount = await this.getBounty();

    const approvedAllowance = await baseToken.methods
      .allowance(facilitatorAddress, this.gatewayAddress)
      .call();

    return new BN(bountyAmount).lte(new BN(approvedAllowance));
  }

  /**
   * Performs stake.
   *
   * @param {string} staker Staker address.
   * @param {string} amount Amount to stake.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gasPrice Gas price that staker is willing to pay for the reward.
   * @param {string} gasLimit Maximum gas limit for reward calculation.
   * @param {string} nonce Staker nonce.
   * @param {string} hashLock Hash lock.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Object} Raw transaction object.
   */
  async stake(
    staker,
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    hashLock,
    txOption,
  ) {
    if (!Web3.utils.isAddress(staker)) {
      throw new Error('Invalid staker address.');
    }

    if (new BN(amount).eqn(0)) {
      throw new Error('Stake amount must not be zero.');
    }

    if (!Web3.utils.isAddress(beneficiary)) {
      throw new Error('Invalid beneficiary address.');
    }

    if (gasPrice === undefined) {
      throw new Error('Invalid gas price.');
    }

    if (gasLimit === undefined) {
      throw new Error('Invalid gas limit.');
    }

    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }

    if (!Web3.utils.isAddress(txOption.from)) {
      throw new Error('Invalid facilitator address.');
    }
    const gatewayContract = Contracts.getEIP20Gateway(
      this.originWeb3,
      this.gatewayAddress,
    );

    const tx = gatewayContract.methods.stake(
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      nonce,
      hashLock,
    );

    return StakeHelper.sendTransaction(tx, txOption);
  }

  /**
   * Performs stake.
   *
   * @param {string} blockHeight Block number.
   * @param {string} accountData Encoded account data.
   * @param {string} accountProof Account proof data.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  proveGateway(blockHeight, accountData, accountProof, txOption) {
    if (blockHeight === undefined) {
      throw new Error('Invalid block height.');
    }

    if (typeof accountData !== 'string') {
      throw new Error('Invalid account data.');
    }

    if (typeof accountProof !== 'string') {
      throw new Error('Invalid account proof.');
    }

    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }

    const coGatewayContract = Contracts.getEIP20CoGateway(
      this.auxiliaryWeb3,
      this.coGatewayAddress,
    );

    const tx = coGatewayContract.methods.proveGateway(
      blockHeight,
      accountData,
      accountProof,
    );

    return StakeHelper.sendTransaction(tx, txOption);
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
   * @returns {Object} Raw transaction object.
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
    txOption,
  ) {
    if (!Web3.utils.isAddress(staker)) {
      throw new Error('Invalid staker address.');
    }

    if (typeof nonce !== 'string') {
      throw new Error('Invalid nonce.');
    }

    if (!Web3.utils.isAddress(beneficiary)) {
      throw new Error('Invalid beneficiary address.');
    }

    if (typeof amount !== 'string') {
      throw new Error('Invalid stake amount.');
    }

    if (typeof gasPrice !== 'string') {
      throw new Error('Invalid gas price.');
    }

    if (typeof gasLimit !== 'string') {
      throw new Error('Invalid gas limit.');
    }

    if (typeof blockHeight !== 'string') {
      throw new Error('Invalid block height.');
    }

    if (typeof storageProof !== 'string') {
      throw new Error('Invalid storage proof data.');
    }

    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }

    const coGatewayContract = Contracts.getEIP20CoGateway(
      this.auxiliaryWeb3,
      this.coGatewayAddress,
    );

    const tx = coGatewayContract.methods.confirmStakeIntent(
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

    return StakeHelper.sendTransaction(tx, txOption);
  }

  /**
   * Performs progress mint.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} promise object.
   */
  progressMint(messageHash, unlockSecret, txOption) {
    if (typeof messageHash !== 'string') {
      throw new Error('Invalid message hash.');
    }

    if (typeof unlockSecret !== 'string') {
      throw new Error('Invalid unlock secret.');
    }

    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }

    const coGatewayContract = Contracts.getEIP20CoGateway(
      this.auxiliaryWeb3,
      this.coGatewayAddress,
    );

    const tx = coGatewayContract.methods.progressMint(
      messageHash,
      unlockSecret,
    );

    return StakeHelper.sendTransaction(tx, txOption);
  }

  /**
   * Performs progress stake.
   *
   * @param {string} messageHash Message hash.
   * @param {string} unlockSecret Unlock secret.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise} promise object.
   */
  progressStake(messageHash, unlockSecret, txOption) {
    if (typeof messageHash !== 'string') {
      throw new Error('Invalid message hash.');
    }

    if (typeof unlockSecret !== 'string') {
      throw new Error('Invalid unlock secret.');
    }

    if (!txOption) {
      throw new Error('Invalid transaction options.');
    }

    const gatewayContract = Contracts.getEIP20Gateway(
      this.originWeb3,
      this.gatewayAddress,
    );

    const tx = gatewayContract.methods.progressStake(
      messageHash,
      unlockSecret,
    );

    return StakeHelper.sendTransaction(tx, txOption);
  }

  /**
   * Returns the nonce for the given staker account address.
   *
   * @param {string} stakerAddress Staker address.
   * @param {Object} originWeb3 Origin web3 object.
   * @param {string} gateway Gateway contract address.
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
   * Returns the raw transaction object for approving stake amount.
   *
   * @param {string} value Amount to approve.
   * @param {Object} txOptions Transaction options.
   * @param {Object} web3 Web3 object.
   * @param {string} valueToken Value token contract address.
   * @param {string} gateway Gateway contract address.
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
   * @param {string} gateway Gateway contract address.
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

  /**
   * Helper function to send ethereum transaction.
   *
   * @param {Object} tx Transaction object.
   * @param {Object} tx Transaction options.
   *
   * @returns {Promise} Promise object.
   */
  static sendTransaction(tx, txOption) {
    return tx
      .send(txOption)
      .on('transactionHash', (transactionHash) => {})
      .on('receipt', (receipt) => {})
      .on('error', (error) => {});
  }
}

module.exports = StakeHelper;
