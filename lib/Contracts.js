'use strict';

const InstanceComposer = require('../instance_composer');

require('../lib/contract_interacts/Core.js');
require('../lib/contract_interacts/ERC20Gateway.js');
require('../lib/contract_interacts/MockToken.js');
require('../lib/setup/initStakeAndMint.js');

const Contracts = function(config, ic) {
  const oThis = this;
  oThis.Core = ic.Core();
  oThis.ERC20Gateway = ic.ERC20Gateway();
  oThis.MockToken = ic.MockToken();
  oThis.StakeAndMint = ic.StakeAndMint();
};

InstanceComposer.register(Contracts, 'Contracts', true);
module.exports = Contracts;
