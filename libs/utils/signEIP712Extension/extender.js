'use strict';

let extend = function() {
  const Accounts = require('web3-eth-accounts');

  if (Accounts.prototype.signEIP712TypedData) {
    //It may have already been added by other package.
    return;
  }

  const Account = require('eth-lib/lib/account');
  const TypedData = require('../../../libs/utils/signEIP712Extension/TypedData');

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
        v: vrs[0],
        r: vrs[1],
        s: vrs[2],
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
  Accounts.prototype._addAccountFunctions = function(account) {
    const oAccounts = this;
    account = orgAddAccountFunctions.apply(oAccounts, arguments);

    account.signEIP712TypedData = function(transaction, callback, version) {
      return oAccounts.signEIP712TypedData(transaction, account.privateKey, callback, version);
    };

    return account;
  };
};

module.exports = extend;
