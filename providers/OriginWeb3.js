'use strict';
const Web3 = require('web3');

const InstanceComposer = require('../instance_composer');

// let _instances = {};

const OriginWeb3 = function() {
  const oThis = this,
    provider = oThis.ic().configStrategy.origin.provider;

  console.log('OriginWeb3 provider', provider);
  // if ( _instances[ provider ] ) {
  //   return _instances[ provider ];
  // }
  // _instances[ provider ] = oThis;

  Web3.call(oThis, provider);

  // Add signAndSend
  oThis.bindSigner();
};

if (Web3.prototype) {
  OriginWeb3.prototype = Object.create(Web3.prototype);
} else {
  OriginWeb3.prototype = {};
}
OriginWeb3.prototype.constructor = OriginWeb3;
OriginWeb3.prototype.bindSigner = function() {
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
      const oInteractor = signers.getOriginSignerService();
      if (!oInteractor) {
        return Promise.reject('Origin Signer Service is missing.');
      }

      let signerService = oInteractor.getSignerService();

      let signerPromise = signerService(txToBeSigned);

      if (signerPromise instanceof Promise) {
        return signerPromise.then(function(signedTxPayload) {
          console.log('signedTxPayload', signedTxPayload);
          return oWeb3.eth.sendSignedTransaction(signedTxPayload.raw, callback);
        });
      }
      throw 'Signer Service did not return a promise.';
    };
    return txObject;
  };
  Contract.prototype._createTxObject._isOst = true;
};

InstanceComposer.registerShadowableClass(OriginWeb3, 'OriginWeb3');
module.exports = OriginWeb3;
