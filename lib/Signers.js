'use strict';

const InstanceComposer = require('../instance_composer');
require('../lib/signer/SignerServiceInteractor');

const Signers = function(config, ic) {
  const oThis = this;
  oThis.auxiliarySignerInteractors = {};
};

Signers.prototype = {
  originSignerInteractor: null,
  setOriginSignerService: function(signerService) {
    const oThis = this,
      Interactor = oThis.ic().SignerServiceInteractor();
    oThis.originSignerInteractor = new Interactor(signerService);
  },
  getOriginSignerService: function() {
    const oThis = this;
    return oThis.originSignerInteractor;
  },

  auxiliarySignerInteractor: null,
  setAuxiliarySignerService: function(signerService, coreId) {
    const oThis = this,
      Interactor = oThis.ic().SignerServiceInteractor();
    //Temp Code.
    //TBD: Map interactor to coreId and store in oThis.auxiliarySignerInteractors.
    oThis.auxiliarySignerInteractor = new Interactor(signerService);
  },
  getAuxiliarySignerService: function(coreId) {
    //Temp Code.
    return oThis.auxiliarySignerInteractor;
  }
};

InstanceComposer.register(Signers, 'Signers', true);
module.exports = Signers;
