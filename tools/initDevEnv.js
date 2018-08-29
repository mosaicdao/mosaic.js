'use strict';

const shell = require('shelljs');

const InitDevEnv = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;
  oThis.originAddresses = {};
  oThis.auxiliaryAddresses = {};
};

InitDevEnv.prototype = {
  perform: async function() {
    const oThis = this;

    // remove earlier setup
    oThis.handleShellResponse(shell.exec('rm -rf ' + oThis.setupRoot + '/*'));

    // create new setup folder
    oThis.handleShellResponse(shell.exec('mkdir -p ' + oThis.setupRoot));

    // init value GETH
    await oThis.initOriginGeth();

    // init auxiliary GETH
    await oThis.initAuxiliaryGeth();

    await oThis.fundEth();

    await oThis.deploySimpleToken();

    await oThis.fundOst();

    await oThis.updateConfigFile();

    shell.exec('rm -rf ' + folder);
  },

  handleShellResponse: function(res) {
    if (res.code !== 0) {
      shell.exit(1);
    }

    return res;
  }
};

// commander

new InitDevEnv({
  setupRoot: '~/mosaic-setup' // later to come as argument for this script
}).perform();
