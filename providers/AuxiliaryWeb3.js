'use strict';
const Web3 = require('web3');

const InstanceComposer = require('../instance_composer');

const AuxiliaryWeb3 = function(originCoreContractAddress) {
  const oThis = this,
    auxiliaries = oThis.ic().configStrategy.auxiliaries;

  let provider;
  if (typeof originCoreContractAddress === 'object') {
    let auxiliaryWeb3Config = originCoreContractAddress;
    provider = auxiliaryWeb3Config.provider;
  } else {
    let len = auxiliaries.length;
    originCoreContractAddress = String(originCoreContractAddress).toLowerCase();
    while (len--) {
      let auxConfig = auxiliaries[len];
      if (String(auxConfig.originCoreContractAddress).toLowerCase() === originCoreContractAddress) {
        provider = auxConfig.provider;
      }
    }
  }

  if (!provider) {
    throw "No Auxiliary defined with origin core contract address '" + originCoreContractAddress + "'";
  }

  Web3.call(oThis, provider);

  oThis.coreId = originCoreContractAddress;

  // Add signAndSend
  oThis.bindSigner();
};

if (Web3.prototype) {
  AuxiliaryWeb3.prototype = Object.create(Web3.prototype);
} else {
  AuxiliaryWeb3.prototype = {};
}
AuxiliaryWeb3.prototype.constructor = AuxiliaryWeb3;
AuxiliaryWeb3.prototype.coreId = null;
AuxiliaryWeb3.prototype.bindSigner = function() {
  //

  const oWeb3 = this,
    Contract = oWeb3.eth.Contract;

  const org_createTxObject = Contract.prototype._createTxObject;

  Contract.prototype._createTxObject = function() {
    const oContract = this;
    let txObject = org_createTxObject.apply(oContract, arguments);
    txObject.signAndSend = function(options, callback) {
      const oTxObject = this;

      let requestData = oTxObject.send.request(options),
        txToBeSigned = Object.assign({}, requestData.params[0]);

      const signers = oWeb3.ic().Signers();
      const oInteractor = signers.getAuxiliarySignerService(oWeb3.coreId);
      if (!oInteractor) {
        return Promise.reject('Auxiliary Signer Service is missing.');
      }

      let signerService = oInteractor.getSignerService();

      let signerPromise = signerService(txToBeSigned);

      if (signerPromise instanceof Promise) {
        return signerPromise.then(function(signedTxPayload) {
         // console.log('signedTxPayload', signedTxPayload);
          return oWeb3.eth.sendSignedTransaction(signedTxPayload.raw, callback);
        });
      }
      throw 'Signer Service did not return a promise.';
    };
    return txObject;
  };
  Contract.prototype._createTxObject._isOst = true;
};

InstanceComposer.registerShadowableClass(AuxiliaryWeb3, 'AuxiliaryWeb3');

module.exports = AuxiliaryWeb3;
