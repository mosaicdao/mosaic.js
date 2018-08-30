'use strict';

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

    console.log('Env init DONE!');
  },

  _initCore: function() {
    let InitCore = require('./InitCore.js');

    return new InitCore().perform();
  }
};

// commander
const os = require('os');
new InitChains({
  setupRoot: os.homedir() + '/mosaic-setup' // later to come as argument for this script
}).perform();
