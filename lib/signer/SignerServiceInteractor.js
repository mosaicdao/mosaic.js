'use strict';

const InstanceComposer = require('../../instance_composer');

const SignerServiceInteractor = function(signerService) {
  const oThis = this;
  if (signerService) {
    oThis.setSigner(signerService);
  }
};

SignerServiceInteractor.prototype = {
  constructor: SignerServiceInteractor,
  setSigner: function(signerService) {
    const oThis = this;
    oThis.getSignerService = function() {
      return signerService;
    };
  }
};

InstanceComposer.registerShadowableClass(SignerServiceInteractor, 'SignerServiceInteractor');
