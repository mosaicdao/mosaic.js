"use strict";

const InstanceComposer = require('../instance_composer');

require('../contract_interacts/Core.js');
require('../contract_interacts/ERC20Gateway.js');

const Contracts = function ( config, ic ) {
  const oThis = this;
  oThis.Core  = ic.Core();
  oThis.ERC20Gateway = ic.ERC20Gateway();
};


InstanceComposer.register(Contracts, 'Contracts', true);
module.exports = Contracts;