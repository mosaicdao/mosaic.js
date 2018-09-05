'use strict';

const shell = require('shelljs'),
  BigNumber = require('bignumber.js'),
  fs = require('fs'),
  path = require('path'),
  program = require('commander');

const OSTPrimeDeployer = require('./OSTPrimeDeployer.js'),
  InitCore = require('./InitCore.js'),
  GatewayDeployer = require('./GatewayDeployer'),
  MessageBusDeployer = require('./MessageBusDeployer'),
  LinkOSTPrimeGateways = require('./LinkOSTPrimeGateways');

const InitChains = function(params) {
  const oThis = this;
  Object.assign(oThis, params);
};

InitChains.prototype = {
  perform: async function() {
    const oThis = this;

    //deploy the core contracts on both the chains
    console.log('\n* Deploying core contracts on both the chains');
    await oThis._initCore();

    console.log('\n* Deploying OSTPrime Contract');
    // await oThis._deployOSTPrimeContract();

    console.log('\n* Deploying Message Bus Library');
    await oThis._messageBusLibrary();

    console.log('\n* Deploying Gateways');
    await oThis._deployGateway();

    console.log('\n* Linking Gateways for OSTPrime');
    await oThis._linkOSTPrimeGateways();

    console.log('Auxiliary chain setup is complete');
    console.log('Output config file path:', oThis.configOutputPath);
    process.exit(0);
  },

  _initCore: function() {
    const oThis = this;
    return new InitCore(oThis.config, oThis.configOutputPath).perform();
  },
  _deployGateway: function() {
    const oThis = this;
    return new GatewayDeployer(oThis.config, oThis.configOutputPath).deploy();
  },

  _deployOSTPrimeContract: function() {
    const oThis = this;
    return new OSTPrimeDeployer(oThis.config, oThis.configOutputPath).perform();
  },

  _messageBusLibrary: function() {
    const oThis = this;
    return new MessageBusDeployer(oThis.config, oThis.configOutputPath).perform();
  },

  _linkOSTPrimeGateways: function() {
    const oThis = this;
    return new LinkOSTPrimeGateways(oThis.config, oThis.configOutputPath).perform();
  }
};

(function() {
  program
    .version('0.1.0')
    .usage('<path_to_auxiliary_chain_config>')
    .parse(process.argv);

  let configPath = program.args[0];
  let config;

  try {
    if (!configPath) {
      let err = new Error('Please provide path to chain setup config JSON file.');
      throw err;
    }
    configPath = path.resolve(configPath);

    let fileStats = fs.statSync(configPath);
    if (!fileStats.isFile()) {
      let err = new Error('Invalid config file path.');
      throw err;
    }
    config = require(configPath);
  } catch (err) {
    console.log(err.message);
    process.exit(0);
  }

  new InitChains({
    config: config,
    configOutputPath: configPath
  }).perform();
})();
