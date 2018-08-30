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

const InitDevEnv = function(params) {
  const oThis = this;

  oThis.setupRoot = params.setupRoot;
  oThis.originAddresses = {};
  oThis.auxiliaryAddresses = {};
  oThis.configJsonFilePath = oThis.setupRoot + '/' + 'config.json';
  oThis.originGethShellPath = null;
  oThis.auxiliaryGethShellPath = null;
  oThis.auxiliaryGethShellPathWithZeroGas = null;
};

InitDevEnv.prototype = {
  perform: async function() {
    const oThis = this;

    // remove earlier setup
    oThis._handleShellResponse(shell.exec('rm -rf ' + oThis.setupRoot + '/*'));

    // create new setup folder
    oThis._handleShellResponse(shell.exec('mkdir -p ' + oThis.setupRoot));

    // create new setup folder
    oThis._handleShellResponse(shell.exec('mkdir -p ' + oThis.setupRoot + '/bin'));

    // create bin folder
    oThis._handleShellResponse(shell.exec('mkdir -p ' + oThis.setupRoot + '/logs'));

    // create logs folder
    oThis._handleShellResponse(shell.exec('echo {} > ' + oThis.configJsonFilePath));

    // init value GETH
    oThis._initOriginGeth();

    // init auxiliary GETH
    oThis._initAuxiliaryGeth();

    // start services
    let startWithZeroGas = true;
    await oThis._startServices(startWithZeroGas);

    // geth checker
    await oThis._checkForServicesReady();

    // fund ETH
    await oThis._fundEth();

    // Deploy ERC20 Token contract
    let contractDeploymentResponse = await oThis._deployERC20Token();

    await oThis._fundERC20Token(
      contractDeploymentResponse,
      new BigNumber(1000000).mul(etherToWeiCinversion).toString(10)
    );

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

    let logFilePath = oThis.setupRoot + '/logs/origin-geth.log';
    let startCmd =
      `geth --datadir '${originGethFolder}'` +
      ` --networkid ${setUpConfig.origin.networkId}` +
      ` --port ${setUpConfig.origin.geth.port}` +
      ` --mine --minerthreads 1 --targetgaslimit ${setUpConfig.origin.gasLimit} --gasprice 0x3B9ACA00` +
      ` --rpc --rpcapi eth,net,web3,personal,txpool --rpcaddr ${setUpConfig.origin.geth.host} --rpcport ${
        setUpConfig.origin.geth.rpcport
      }` +
      ` --ws --wsapi eth,net,web3,personal,txpool --wsaddr ${setUpConfig.origin.geth.host} --wsport ${
        setUpConfig.origin.geth.wsport
      } --wsorigins '*'` +
      ` --etherbase ${originMiner} --unlock ${originMiner} --password ${originPasswordFilePath}` +
      ` 2> ${logFilePath}`;

    console.log('origin start command:\n', startCmd);

    //Create shell script
    let originShellScriptPath = oThis.setupRoot + '/bin/run-origin.sh';
    oThis._handleShellResponse(shell.exec('echo #!/bin/sh > ' + originShellScriptPath));
    oThis._handleShellResponse(shell.exec(`echo "${startCmd}" >> ${originShellScriptPath}`));

    oThis.originGethShellPath = originShellScriptPath;
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

    let logFilePath = oThis.setupRoot + '/logs/auxiliary-geth.log';
    let startCmd =
      `geth --datadir '${auxiliaryGethFolder}'` +
      ` --networkid ${setUpConfig.auxiliary.networkId}` +
      ` --port ${setUpConfig.auxiliary.geth.port}` +
      ` --mine --minerthreads 1 --targetgaslimit ${setUpConfig.auxiliary.gasLimit} --gasprice 0x3B9ACA00` +
      ` --rpc --rpcapi eth,net,web3,personal,txpool --rpcaddr ${setUpConfig.auxiliary.geth.host} --rpcport ${
        setUpConfig.auxiliary.geth.rpcport
      }` +
      ` --ws --wsapi eth,net,web3,personal,txpool --wsaddr ${setUpConfig.auxiliary.geth.host} --wsport ${
        setUpConfig.auxiliary.geth.wsport
      } --wsorigins '*'` +
      ` --etherbase ${auxiliarySealer} --unlock ${auxiliarySealer} --password ${auxiliaryPasswordFilePath}` +
      ` 2> ${logFilePath}`;

    console.log('auxiliary start command:\n', startCmd);

    //Create shell script
    let auxiliaryShellScriptPath = oThis.setupRoot + '/bin/run-auxiliary.sh';
    oThis._handleShellResponse(shell.exec('echo #!/bin/sh > ' + auxiliaryShellScriptPath));
    oThis._handleShellResponse(shell.exec(`echo "${startCmd}" >> ${auxiliaryShellScriptPath}`));

    //Modify start cmd to start with zero gas.
    startCmd = startCmd.replace('--gasprice 0x3B9ACA00', '--gasprice 0x0');

    //Create shell script for zero gas price.
    let zeroGasAuxiliaryShellScriptPath = oThis.setupRoot + '/bin/run-auxiliary-with-zero-gas.sh';
    oThis._handleShellResponse(shell.exec('echo #!/bin/sh > ' + zeroGasAuxiliaryShellScriptPath));
    oThis._handleShellResponse(shell.exec(`echo "${startCmd}" >> ${zeroGasAuxiliaryShellScriptPath}`));

    oThis.auxiliaryGethShellPath = auxiliaryShellScriptPath;
    oThis.auxiliaryGethShellPathWithZeroGas = zeroGasAuxiliaryShellScriptPath;
  },

  _startServices: function(startWithZeroGas) {
    const oThis = this;

    //Start Auxiliary Geth
    let auxiliaryGethShellPath = oThis.auxiliaryGethShellPath;
    if (startWithZeroGas) {
      auxiliaryGethShellPath = oThis.auxiliaryGethShellPathWithZeroGas;
    }
    shellAsyncCmd.run(`sh ${auxiliaryGethShellPath}`);
    // oThis._handleShellResponse(shell.exec( `sh ${auxiliaryGethShellPath}` ));

    //Start Origin Geth
    shellAsyncCmd.run(`sh ${oThis.originGethShellPath}`);
    // oThis._handleShellResponse(shell.exec( `sh ${oThis.originGethShellPath}` ));

    console.log('------- Sleeping for 5 seconds. Lets wait for geth to come up.');
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        console.log('------- I am Awake.');
        resolve();
      }, 5000);
    });
  },

  _checkForServicesReady: function() {
    const oThis = this;

    let GethChecker = require('./GethChecker');

    return new GethChecker([oThis._originRpc(), oThis._auxiliaryRpc()]).perform();
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

    console.log('senderAddr', senderAddr);

    let len = ethRecipients.length;
    while (len--) {
      let recipientName = ethRecipients[len];
      let recipient = configFileContent[recipientName];
      console.log(`Funding ${recipientName} (${recipient}) with ${amount} Wei`);
      await oThis._fundEthFor(web3Provider, senderAddr, recipient, amount);
      console.log(`----- ${recipientName} (${recipient}) has received ${amount} Wei`);
    }
  },

  _deployERC20Token: function() {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let deployerAddress = configFileContent.originDeployerAddress,
      web3Provider = new Web3(oThis._originRpc());

    let InitERC20Token = require('./InitERC20Token');

    console.log('Deploying ERC20 Token');
    return new InitERC20Token({
      web3Provider: web3Provider,
      deployerAddress: deployerAddress,
      deployerPassphrase: originPassphrase,
      gasPrice: setUpConfig.origin.gasprice,
      gasLimit: setUpConfig.origin.gasLimit
    })
      .perform()
      .then(function(response) {
        console.log('----- ERC20 Token has been deployed');
        return response;
      });
  },

  _fundERC20Token: function(contractDeploymentResponse, amount) {
    const oThis = this;

    let configFileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    let erc20TokenContract = contractDeploymentResponse.instance;

    return erc20TokenContract.methods.transfer(configFileContent.ostPrimeStakerAddress, amount).send({
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
  },

  _auxiliaryRpc: function() {
    return 'http://' + setUpConfig.auxiliary.geth.host + ':' + setUpConfig.auxiliary.geth.rpcport;
  }
};

// commander
const os = require('os');
new InitDevEnv({
  setupRoot: os.homedir() + '/mosaic-setup' // later to come as argument for this script
}).perform();
