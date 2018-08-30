'use strict';

const shell = require('shelljs'),
  editJsonFile = require('edit-json-file'),
  BigNumber = require('bignumber.js'),
  fs = require('fs'),
  Path = require('path'),
  Web3 = require('web3'),
  shellAsyncCmd = require('node-cmd');

const setUpConfig = require('./config.js');

const originGethFolder = setUpConfig.origin.gethFolder,
  auxiliaryGethFolder = setUpConfig.auxiliary.gethFolder,
  originPassphrase = 'testtest',
  auxiliaryPassphrase = 'testtest',
  hexStartsWith = '0x',
  originPasswordFilePath = originGethFolder + '/pwd',
  auxiliaryPasswordFilePath = auxiliaryGethFolder + '/pwd',
  etherToWeiCinversion = new BigNumber(1000000000000000000);

const InitEnv = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;
};

InitEnv.prototype = {
  perform: async function() {
    const oThis = this;

    // deploy the core contracts on both the chains

    console.log('Env init DONE!');
  },

  _originRpc: function() {
    return 'http://' + setUpConfig.origin.geth.host + ':' + setUpConfig.origin.geth.rpcport;
  },

  _auxiliaryRpc: function() {
    return 'http://' + setUpConfig.auxiliary.geth.host + ':' + setUpConfig.auxiliary.geth.rpcport;
  }
};

// commander
const os = require('os');
new InitEnv({
  setupRoot: os.homedir() + '/mosaic-setup' // later to come as argument for this script
}).perform();
