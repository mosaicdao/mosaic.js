'use strict';

const shell = require('shelljs'),
  editJsonFile = require('edit-json-file'),
  BigNumber = require('bignumber.js'),
  fs = require('fs'),
  Path = require('path'),
  Web3 = require('web3');

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
  oThis.configJsonFilePath = oThis.setupRoot + '/' + 'config.json';
};

InitDevEnv.prototype = {
  perform: async function() {
    const oThis = this;

    // remove earlier setup
    oThis._handleShellResponse(shell.exec('rm -rf ' + oThis.setupRoot + '/*'));

    // create new setup folder
    oThis._handleShellResponse(shell.exec('mkdir -p ' + oThis.setupRoot));

    oThis._handleShellResponse(shell.exec('echo {} > ' + oThis.configJsonFilePath));

    // init value GETH
    oThis._initOriginGeth();

    // init auxiliary GETH
    oThis._initAuxiliaryGeth();

    // start services

    // fund ETH
    await oThis._fundEth();

    // Deploy ERC20 Token contract
    let contractDeploymentResponse = await oThis._deployERC20Token();
    
    await oThis._fundERC20Token(contractDeploymentResponse, new BigNumber(1000000).mul(etherToWeiCinversion).toString(10));

    console.log('Dev env init DONE!');
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
      setUpConfig.origin.genesisFileTemplatePath,
      setUpConfig.origin.genesisFilePath
    );

    let initCmd = 'geth --datadir "' + originGethFolder + '" init ' + setUpConfig.origin.genesisFilePath;
    console.log('_initOriginGeth :: Geth Init. Command:\n', initCmd);
    oThis._handleShellResponse(shell.exec(initCmd));

    oThis._addConfig({
      chainOwnerOriginAddress: chainOwnerOriginAddress,
      originWorkerAddress: originWorkerAddress,
      originDeployerAddress: originDeployerAddress,
      ostPrimeStakerAddress: ostPrimeStakerAddress,
      originFacilitator: originFacilitator,
      originMiner: originMiner
    });
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
      setUpConfig.auxiliary.genesisFileTemplatePath,
      setUpConfig.auxiliary.genesisFilePath,
      auxiliarySealer
    );

    let initCmd = 'geth --datadir "' + auxiliaryGethFolder + '" init ' + setUpConfig.auxiliary.genesisFilePath;
    console.log('_initOriginGeth :: Geth Init. Command:\n', initCmd);
    oThis._handleShellResponse(shell.exec(initCmd));

    oThis._addConfig({
      chainOwnerAuxiliaryAddress: chainOwnerAuxiliaryAddress,
      auxiliaryWorkerAddress: auxiliaryWorkerAddress,
      auxiliaryDeployerAddress: auxiliaryDeployerAddress,
      auxiliaryFacilitator: auxiliaryFacilitator,
      auxiliarySealer: auxiliarySealer
    });
  },

  _fundEth: async function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let senderAddr = configFileContent.chainOwnerOriginAddress,
      web3Provider = new Web3(oThis._originRpc()),
      amount = '100000000000000000000';

    let ethRecipients = [
      'originWorkerAddress',
      'originDeployerAddress',
      'ostPrimeStakerAddress',
      'originFacilitator',
      'originMiner'
    ];

    for (let recipientName in ethRecipients) {
      let recipient = configFileContent[recipientName];
      await oThis._fundEthFor(web3Provider, senderAddr, recipient, amount);
    }
  },

  _deployERC20Token: function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let deployerAddress = configFileContent.originDeployerAddress,
      web3Provider = new Web3(oThis._originRpc());

    let InitERC20Token = require('./InitERC20Token');

    return new InitERC20Token({
      web3Provider: web3Provider,
      deployerAddress: deployerAddress,
      deployerPassphrase: originPassphrase,
      gasPrice: setUpConfig.origin.gasprice,
      gasLimit: setUpConfig.origin.gasLimit
    }).perform();
  },
	
	_fundERC20Token: function(contractDeploymentResponse, amount) {
	  const oThis = this;
	
	  let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));
		
		let erc20TokenContract = contractDeploymentResponse.instance;
		
		return erc20TokenContract.methods
			.transfer(configFileContent.ostPrimeStakerAddress, amount)
			.send({
				from: configFileContent.originDeployerAddress,
				gasPrice: setUpConfig.origin.gasprice,
				gas: setUpConfig.origin.gasLimit
			});
	  
  },

  _fundEthFor: function(web3Provider, senderAddr, recipient, amount) {
    return web3Provider.eth.personal.unlockAccount(senderAddr, originPassphrase).then(function() {
      return web3Provider.eth.sendTransaction({
        from: senderAddr,
        to: recipient,
        value: amount,
        gasPrice: setUpConfig.origin.gasprice,
        gas: setUpConfig.origin.gasLimit
      });
    });
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
    chainGenesisTemplateLocation,
    chainGenesisLocation,
    sealerAddress
  ) {
    const oThis = this;

    let fileContent = JSON.parse(fs.readFileSync(chainGenesisTemplateLocation, 'utf8'));

    // Alloc balance to required address
    let allocAmountInWeis = new BigNumber(allocAmount).mul(etherToWeiCinversion).toString(16);
    let allocObject = {};
    allocObject[allocAmountToAddress] = { balance: hexStartsWith + allocAmountInWeis };
    fileContent.alloc = allocObject;

    // set chain id
    fileContent.config.chainId = chainId;

    // set gas limit
    let bnGasLimit = new BigNumber(gasLimit);
    fileContent.gasLimit = hexStartsWith + bnGasLimit.toString(16);

    // add extra data
    if (sealerAddress) {
      const extraData =
        '0x0000000000000000000000000000000000000000000000000000000000000000' +
        sealerAddress.replace(hexStartsWith, '') +
        '0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';
      fileContent.extraData = extraData;
    }

    console.log(JSON.stringify(fileContent));

    oThis._handleShellResponse(shell.exec("echo '" + JSON.stringify(fileContent) + "' > " + chainGenesisLocation));

    return true;
  },

  _handleShellResponse: function(res) {
    if (res.code !== 0) {
      shell.exit(1);
    }

    return res;
  },

  _addConfig: function(params) {
    const oThis = this;

    let fileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    for (var i in params) {
      fileContent[i] = params[i];
    }

    oThis._handleShellResponse(shell.exec("echo '" + JSON.stringify(fileContent) + "' > " + oThis.configJsonFilePath));
  },

  _originRpc: function() {
    return 'http://' + setUpConfig.origin.geth.host + ':' + setUpConfig.origin.geth.rpcport;
  }
};

// commander
const os = require('os');
new InitDevEnv({
  setupRoot: os.homedir() + '/mosaic-setup' // later to come as argument for this script
}).perform();
