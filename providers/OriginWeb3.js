'use strict';
const Web3 = require('web3');
const signerServiceBinder = require("../providers/signerServiceBinder");

const InstanceComposer = require('../instance_composer');

// let _instances = {};

const OriginWeb3 = function() {
  const oThis = this,
    provider = oThis.ic().configStrategy.origin.provider;

  console.log('OriginWeb3 provider', provider);

  Web3.call(oThis, provider);

  // Bind send method with signer.
  oThis.bindSigner();
};

if (Web3.prototype) {
  OriginWeb3.prototype = Object.create(Web3.prototype);
} else {
  OriginWeb3.prototype = {};
}
OriginWeb3.prototype.constructor = OriginWeb3;

OriginWeb3.prototype.signerServiceInteract = function () {
  const oThis = this;

  let signers = oThis.ic().Signers();
  return signers.getOriginSignerService();
};


signerServiceBinder( OriginWeb3.prototype );
InstanceComposer.registerShadowableClass(OriginWeb3, 'OriginWeb3');

module.exports = OriginWeb3;
