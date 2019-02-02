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

const Web3Utils = require('web3-utils');
const Web3 = require('web3');
const Crypto = require('crypto');

const MessageStatus = Object.freeze({
  UNDECLARED: '0',
  DECLARED: '1',
  PROGRESSED: '2',
  REVOCATION_DECLARED: '3',
  REVOKED: '4',
});

/**
 * This class includes the utitity functions.
 * @class
 * @classdesc Provides the common utility functions.
 */
class Utils {
  /**
   * @typedef {Object} HashLock
   *
   * @property {string} secret The string that was used to generate hash lock
   * and unlock secret.
   *
   * @property {string} unlockSecret The unlock secret string.
   *
   * @property {string} hashLock The hash lock.
   */

  /**
   * @function createSecretHashLock
   *
   * Creates a random secret string, unlock secrete and hashlock.
   *
   * @returns {HashLock} HashLock object.
   */
  static createSecretHashLock() {
    const secret = Crypto.randomBytes(16).toString('hex');
    return Utils.toHashLock(secret);
  }

  /**
   * @function toHashLock
   *
   * Returns the HashLock from the given secret string.
   *
   * @param {string} secretString The secret string.
   *
   * @returns {HashLock} HashLock object.
   */
  static toHashLock(secretString) {
    const secretBytes = Buffer.from(secretString);

    return {
      secret: secretString,
      unlockSecret: `0x${secretBytes.toString('hex')}`,
      hashLock: Web3Utils.keccak256(secretString),
    };
  }

  /**
   * Generate the message hash from the stake request params.
   *
   * @param {string} intentHash Intent hash.
   * @param {nonce} nonce Nonce.
   * @param {string} gasPrice Gas price.
   * @param {string} gasLimit Gas limit.
   * @param {string} sender Sender address.
   * @param {string} hashLock Hash lock.
   *
   * @returns {string} message hash.
   */
  static getMessageHash(
    intentHash,
    nonce,
    gasPrice,
    gasLimit,
    sender,
    hashLock,
  ) {
    const web3Obj = new Web3();

    const messageTypeHash = Web3.utils.sha3(
      web3Obj.eth.abi.encodeParameter(
        'string',
        'Message(bytes32 intentHash,uint256 nonce,uint256 gasPrice,uint256 gasLimit,address sender,bytes32 hashLock)',
      ),
    );

    const messageHash = web3Obj.utils.sha3(
      web3Obj.eth.abi.encodeParameters(
        [
          'bytes32',
          'bytes32',
          'uint256',
          'uint256',
          'uint256',
          'address',
          'bytes32',
        ],
        [
          messageTypeHash,
          intentHash,
          nonce,
          gasPrice,
          gasLimit,
          sender,
          hashLock,
        ],
      ),
    );
    return messageHash;
  }

  /**
   * Generate the stake intent hash from the stake request params.
   *
   * @param {string} amount Stake amount.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gatewayAddress Gateway contract address.
   *
   * @returns {string} stake intent hash.
   */
  static getStakeIntentHash(amount, beneficiary, gatewayAddress) {
    const web3Obj = new Web3();

    const stakeTypeHash = Web3.utils.sha3(
      web3Obj.eth.abi.encodeParameter(
        'string',
        'StakeIntent(uint256 amount,address beneficiary,address gateway)',
      ),
    );

    const stakeIntentHash = web3Obj.utils.sha3(
      web3Obj.eth.abi.encodeParameters(
        ['bytes32', 'uint256', 'address', 'address'],
        [stakeTypeHash, amount, beneficiary, gatewayAddress],
      ),
    );
    return stakeIntentHash;
  }

  /**
   * Returns the message status enum
   *
   * @returns {Object} message status enum.
   */
  static messageStatus() {
    return MessageStatus;
  }
}

module.exports = Utils;
