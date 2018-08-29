'use strict';

const shell = require('shelljs'),
  editJsonFile = require('edit-json-file'),
  BigNumber = require('bignumber.js');

const setUpConfig = require('./config.js');

const originGethFolder = setUpConfig.origin.gethFolder,
  auxiliaryGethFolder = setUpConfig.auxiliary.gethFolder,
  originPassphrase = 'testtest',
  auxiliaryPassphrase = 'testtest',
  hexStartsWith = '0x',
  originPasswordFilePath = originGethFolder + '/pwd',
  auxiliaryPasswordFilePath = auxiliaryGethFolder + '/pwd',
  etherToWeiCinversion = new BigNumber(1000000000000000000);

const InitDevEnv = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;
  oThis.originAddresses = {};
  oThis.auxiliaryAddresses = {};
};

InitDevEnv.prototype = {
  perform: function() {
    const oThis = this;

    // remove earlier setup
    oThis._handleShellResponse(shell.exec('rm -rf ' + oThis.setupRoot + '/*'));

    // create new setup folder
    oThis._handleShellResponse(shell.exec('mkdir -p ' + oThis.setupRoot));

    // init value GETH
    oThis._initOriginGeth();

    // init auxiliary GETH
    oThis._initAuxiliaryGeth();

    oThis.fundEth();

    oThis.deploySimpleToken();

    oThis.fundOst();

    oThis.updateConfigFile();

    shell.exec('rm -rf ' + folder);
  },

  _initOriginGeth: function() {
    const oThis = this;

    oThis._handleShellResponse(shell.exec('mkdir -p ' + originGethFolder));

    oThis._handleShellResponse(shell.exec('echo "' + originPassphrase + '" > ' + originPasswordFilePath));

    let chainOwnerOriginAddress = oThis._generateAddress(originGethFolder);
    let originWorkerAddress = oThis._generateAddress(originGethFolder);
    let originDeployerAddress = oThis._generateAddress(originGethFolder);
    let ostPrimeStakerAddress = oThis._generateAddress(originGethFolder);
    let originFacilitator = oThis._generateAddress(originGethFolder);
    let originMiner = oThis._generateAddress(originGethFolder);

    oThis._modifyGenesisFile(
      setUpConfig.origin.chainId,
      chainOwnerOriginAddress,
      setUpConfig.origin.allocAmount,
      setUpConfig.origin.gasLimit,
      setUpConfig.origin.genesisFilePath
    );

    let initCmd = 'geth --datadir "' + originGethFolder + '" init ' + setUpConfig.origin.genesisFilePath;
    console.log('_initOriginGeth :: Geth Init. Command:\n', initCmd);
    oThis._handleShellResponse(shell.exec(initCmd));
  },

  _initAuxiliaryGeth: function() {
    const oThis = this;

    oThis._handleShellResponse(shell.exec('mkdir -p ' + auxiliaryGethFolder));

    oThis._handleShellResponse(shell.exec('echo "' + auxiliaryPassphrase + '" > ' + auxiliaryPasswordFilePath));

    let chainOwnerAuxiliaryAddress = oThis._generateAddress(auxiliaryGethFolder);
    let auxiliaryWorkerAddress = oThis._generateAddress(auxiliaryGethFolder);
    let auxiliaryDeployerAddress = oThis._generateAddress(auxiliaryGethFolder);
    let auxiliaryFacilitator = oThis._generateAddress(auxiliaryGethFolder);
    let auxiliarySealer = oThis._generateAddress(auxiliaryGethFolder);

    oThis._modifyGenesisFile(
      setUpConfig.auxiliary.chainId,
      chainOwnerAuxiliaryAddress,
      setUpConfig.auxiliary.allocAmount,
      setUpConfig.auxiliary.gasLimit,
      setUpConfig.auxiliary.genesisFilePath,
      auxiliarySealer
    );

    oThis._handleShellResponse(
      shell.exec('geth --datadir "' + auxiliaryGethPath + '" init ' + setUpConfig.auxiliary.genesisFilePath)
    );
  },

  _generateAddress: function(originGethPath) {
    const oThis = this;

    let addressGerationResponse = oThis._handleShellResponse(
      shell.exec('geth --datadir ' + originGethPath + ' account new --password ' + originPasswordFilePath)
    );
    return addressGerationResponse.stdout
      .replace('Address: {', hexStartsWith)
      .replace('}', '')
      .trim();
  },

  _modifyGenesisFile: function(
    chainId,
    allocAmountToAddress,
    allocAmount,
    gasLimit,
    chainGenesisLocation,
    sealerAddress
  ) {
    // If the file doesn't exist, the content will be an empty object by default.
    const file = editJsonFile(chainGenesisLocation);

    let allocAmountInWeis = new BigNumber(allocAmount).mul(etherToWeiCinversion).toString(10);

    // Alloc balance to required address
    file.set('alloc.' + allocAmountToAddress + '.balance', allocAmountInWeis);

    // set chain id
    file.set('config.chainId', chainId);

    // set gas limit
    let bnGasLimit = new BigNumber(gasLimit);
    file.set('gasLimit', hexStartsWith + bnGasLimit.toString(16));

    // add extra data
    if (sealerAddress) {
      const extraData =
        '0x0000000000000000000000000000000000000000000000000000000000000000' +
        sealerAddress.replace(hexStartsWith, '') +
        '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
      file.set('extraData', extraData);
    }

    file.save();

    return true;
  },

  _handleShellResponse: function(res) {
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
