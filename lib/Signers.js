'use strict';

const InstanceComposer = require('../instance_composer');

const Signers = function(config, ic) {
  const oThis = this;
  oThis.auxiliarySignerInteractors = {};
};

Signers.prototype = {
  originSigner: null,
  setOriginSignerService: function(signerService, options ) {
    const oThis = this;
    
    oThis.originSignerInteractor = new SignerServiceInteractor(signerService, options);
  },
  getOriginSignerService: function() {
    const oThis = this;
    return oThis.originSignerInteractor;
  },

  auxiliarySignerInteractors: null,
  setAuxiliarySignerService: function(signerService, coreId, options ) {
    const oThis = this;
    if ( coreId ) coreId = String( coreId ).toLowerCase();

    let interactor = new SignerServiceInteractor(signerService, options);
    oThis.auxiliarySignerInteractors[ coreId ] = interactor;

  },
  getAuxiliarySignerService: function(coreId) {
    const oThis = this;

    if ( coreId ) coreId = String( coreId ).toLowerCase();
    return oThis.auxiliarySignerInteractors[ coreId ];
  }
};

const SignerServiceInteractor = function ( service, options ) {
  const oThis = this;
  options = options || {};

  oThis.service = function () {
    return service;
  };

  oThis.needsNonce = function () {
    return options.needsNonce || false;
  };
};


InstanceComposer.register(Signers, 'Signers', true);
module.exports = Signers;
