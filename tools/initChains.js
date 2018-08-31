'use strict';

const OSTPrimeDeployer = require('./OSTPrimeDeployer.js'),
  InitCore = require('./InitCore.js'),
  GatewayDeployer = require('./GatewayDeployer'),
  MessageBusDeployer = require('./MessageBusDeployer');

const InitChains = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;
  // TODO - this setup root should be passed to every file.
};

InitChains.prototype = {
  perform: async function() {
    const oThis = this;

    // deploy the core contracts on both the chains
    await oThis._initCore();

    await oThis._deployOSTPrimeContract();

    await oThis._messageBusLibrary();

    await oThis._deployGateway();

    console.log('Env init DONE!');
  },

  _initCore: function() {
    return new InitCore().perform();
  },
  _deployGateway: function() {
    return new GatewayDeployer().deploy();
  },

  _deployOSTPrimeContract: function() {
    return new OSTPrimeDeployer().perform();
  },

  _messageBusLibrary: function() {
    return new MessageBusDeployer().perform();
  }
};

// commander
const os = require('os');
new InitChains({
  setupRoot: os.homedir() + '/mosaic-setup' // later to come as argument for this script
}).perform();
