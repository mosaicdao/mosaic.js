'use strict';

module.exports = function(MosaicWeb3Prototype) {
  if (typeof MosaicWeb3Prototype.signerServiceInteract !== 'function') {
    let err = new Error('MosaicWeb3Prototype MUST implement signerServiceInteract method');
    throw err;
  }

  MosaicWeb3Prototype.bindSigner = function() {
    //oWeb3 refers to instace of MosaicWeb3 (OriginWeb3/AuxiliaryWeb3)
    //oWeb3 does NOT refer to the call MosaicWeb3.
    const oWeb3 = this,
      Contract = oWeb3.eth.Contract;

    //Over-ride the _createTxObject method of Contract.
    let org_createTxObject = Contract.prototype._createTxObject;
    Contract.prototype._createTxObject = function() {
      //First execute the original _createTxObject method.
      const oContract = this;

      let txObject = org_createTxObject.apply(oContract, arguments);

      //Over-ride the send method of txObject.
      let org_send = txObject.send;
      if (!org_send) {
        return txObject;
      }
      txObject.send = function(options, callback) {
        let oTxObject = this;

        //Check if signerService is available.
        let signerInteract = oWeb3.signerServiceInteract();
        if (!signerInteract) {
          console.log('signerInteract not found');
          //Lets execute the original send method.
          return org_send.apply(oTxObject, arguments);
        }

        //Lets Prepare Transaction Data to be signed.
        let requestData = oTxObject.send.request(options),
          txToBeSigned = Object.assign({}, requestData.params[0]);

        let signerService = signerInteract.service();

        //Lets get nonce.
        return signerService
          .nonce(txToBeSigned.from)
          .then(function(nonce) {
            txToBeSigned.nonce = nonce;
            //Lets sign the transaction
            return signerService.sign(txToBeSigned);
          })
          .catch(function(reason) {
            //Signer service threw an error.
            //Lets Catch it, give it to callback and throw it again.
            callback &&
              setTimeout(function() {
                callback(reason);
              }, 0);
            throw reason;
          })
          .then(function(signedTxPayload) {
            if (signedTxPayload && typeof signedTxPayload === 'object') {
              //The signer has responded with non-null object.
              //The standard dictates that signed data should be available in 'raw' key of object.
              signedTxPayload = signedTxPayload.raw;
            }

            if (typeof signedTxPayload !== 'string') {
              //Signer failed to give signed raw data.
              let err = new Error('Signer provided invalid signed data');
              callback &&
                setTimeout(function() {
                  callback(err);
                }, 0);
              throw err;
            }

            //Lets send the signed tx.
            return oWeb3.eth.sendSignedTransaction(signedTxPayload, callback);
          });
      };

      //Copy over all org_send methods to new send methods.
      Object.assign(txObject.send, org_send);

      return txObject;
    };
    Contract.prototype._createTxObject._isOst = true;
  };
};
