const Web3 = require('web3');

const MessageStatus = Object.freeze({
  UNDECLARED: '0',
  DECLARED: '1',
  PROGRESSED: '2',
  REVOCATION_DECLARED: '3',
  REVOKED: '4',
});

class Message {
  /**
   * Generate the message hash.
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
   * @param {string} gatewayAddress EIP20Gateway contract address.
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
   * Generate the stake message hash.
   *
   * @param {string} amount Stake amount.
   * @param {string} beneficiary Beneficiary address.
   * @param {string} gatewayAddress EIP20Gateway contract address.
   * @param {nonce} nonce Nonce.
   * @param {string} gasPrice Gas price.
   * @param {string} gasLimit Gas limit.
   * @param {string} sender Sender address.
   * @param {string} hashLock Hash lock.
   *
   * @returns {string} message hash.
   */
  static getStakeMessageHash(
    amount,
    beneficiary,
    gatewayAddress,
    nonce,
    gasPrice,
    gasLimit,
    sender,
    hashLock,
  ) {
    const stakeIntentHash = Message.getStakeIntentHash(
      amount,
      beneficiary,
      gatewayAddress,
    );
    const messageHash = Message.getMessageHash(
      stakeIntentHash,
      nonce,
      gasPrice,
      gasLimit,
      sender,
      hashLock,
    );
    return messageHash;
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

module.exports = Message;
