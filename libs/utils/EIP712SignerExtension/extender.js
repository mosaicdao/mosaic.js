'use strict';

/**
 * This class extends web3 account class and adds signEIP712TypedData function.
 */
let extend = function() {
  const Accounts = require('web3-eth-accounts');

  /**
   * If signEIP712TypedData method is already added, return. No need to extend.
   */
  if (Accounts.prototype.signEIP712TypedData) {
    // It may have already been added by other package.
    return;
  }

  const Account = require('eth-lib/lib/account');
  const TypedData = require('../../../libs/utils/EIP712SignerExtension/TypedData');

  /**
   * Extends Accounts prototype and adds signEIP712TypedData method.
   *
   * @param typedData TypedData instance.
   * @param privateKey Private key to sign the data.
   * @param callback
   * @returns {{messageHash: String, v: *, r: *, s: *, signature: *}}
   */
  Accounts.prototype.signEIP712TypedData = (typedData, privateKey, callback) => {
    let result;
    try {
      if (!(typedData instanceof TypedData)) {
        typedData = TypedData.fromObject(typedData);
      }
      let signHash = typedData.getEIP712SignHash();
      let signature = Account.sign(signHash, privateKey);
      let vrs = Account.decodeSignature(signature);
      result = {
        messageHash: signHash,
        r: vrs[1],
        s: vrs[2],
        v: vrs[0],
        signature: signature
      };
    } catch (error) {
      callback && callback(error);
      throw error;
    }

    callback && callback(null, result);
    return result;
  };

  const orgAddAccountFunctions = Accounts.prototype._addAccountFunctions;

  /**
   * Adds signEIP712TypedData in Accounts instance.
   * @param account Account instance.
   * @returns {Object} Account instance.
   * @private
   */
  Accounts.prototype._addAccountFunctions = function(account) {
    const oAccounts = this;
    account = orgAddAccountFunctions.apply(oAccounts, arguments);

    account.signEIP712TypedData = function(typeDataInstance, callback, version) {
      console.log('Calling signEIP712TypedData function');
      return oAccounts.signEIP712TypedData(typeDataInstance, account.privateKey, callback, version);
    };

    return account;
  };
};

module.exports = extend;
