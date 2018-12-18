'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('../../libs/AbiBinProvider');
const CoGatewayHelper = require('../../libs/helpers/CoGatewayHelper');

const ContractName = 'EIP20Gateway';
class GatewayHelper {
  constructor(web3, address, messageBusAddress, gatewayLibAddress) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.messageBus = messageBusAddress;
    oThis.gatewayLib = gatewayLibAddress;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /*
  //gatewayConfig
  {
    "deployer": "0x...",
    "organization": "0x...",
    "anchor": "0x....",
    "bounty": "123456",
    "messageBus": "0x....",
    "gatewayLib": "0x....",
    "simpleToken": "0x....",
    "organizationOwner": "0x....",
  }
  //coGatewayConfig
  {
    "deployer": "0x...",
    "organization": "0x...",
    "anchor": "0x....",
    "bounty": "123456",
    "messageBus": "0x....",
    "gatewayLib": "0x....",
    "ostPrime": "0x...."
  }
*/
  setup(
    valueToken,
    baseToken,
    gatewayConfig,
    coGatewayConfig,
    gatewayTxOptions,
    coGatewayTxOptions,
    originWeb3,
    auxiliaryWeb3
  ) {
    const oThis = this;
    originWeb3 = originWeb3 || oThis.web3;

    if (!gatewayConfig) {
      throw new Error('Mandatory parameter "gatewayConfig" missing. ');
    }
    if (!coGatewayConfig) {
      throw new Error('Mandatory parameter "coGatewayConfig" missing. ');
    }

    gatewayConfig = gatewayConfig || {};
    gatewayConfig.messageBus = gatewayConfig.messageBus || oThis.messageBus;
    gatewayConfig.gatewayLib = gatewayConfig.gatewayLib || oThis.gatewayLib;

    //For chain setup this should be SimpleToken Contract address.
    gatewayConfig.valueToken = valueToken;
    coGatewayConfig.valueToken = valueToken;

    //For chain setup this should be OSTPrime Contract address.
    gatewayConfig.baseToken = baseToken;
    coGatewayConfig.baseToken = baseToken;

    if (!originWeb3) {
      throw new Error('Mandatory parameter "originWeb3" missing.');
    }

    if (!auxiliaryWeb3) {
      throw new Error('Mandatory parameter "auxiliaryWeb3" missing.');
    }

    GatewayHelper.validateSetupConfig(gatewayConfig);
    CoGatewayHelper.validateSetupConfig(coGatewayConfig);

    if (!gatewayTxOptions) {
      gatewayTxOptions = gatewayTxOptions || {};
    }

    if (typeof gatewayTxOptions.gasPrice === 'undefined') {
      gatewayTxOptions.gasPrice = '0x5B9ACA00';
    }

    let gatewayDeployParams = Object.assign({}, gatewayTxOptions);
    gatewayDeployParams.from = gatewayConfig.deployer;

    if (!coGatewayTxOptions) {
      coGatewayTxOptions = coGatewayTxOptions || {};
    }

    if (typeof coGatewayTxOptions.gasPrice === 'undefined') {
      coGatewayTxOptions.gasPrice = '0x5B9ACA00';
    }

    let coGatewayDeployParams = Object.assign({}, coGatewayTxOptions);
    coGatewayDeployParams.from = coGatewayConfig.deployer;

    let coGatewayHelper = new CoGatewayHelper(auxiliaryWeb3);

    let promiseChain = oThis.deploy(
      gatewayConfig.valueToken,
      gatewayConfig.baseToken,
      gatewayConfig.anchor,
      gatewayConfig.bounty,
      gatewayConfig.organization,
      gatewayConfig.messageBus,
      gatewayConfig.gatewayLib,
      gatewayDeployParams,
      originWeb3
    );

    promiseChain = promiseChain.then(function() {
      let gatewayAddress = oThis.address;
      return coGatewayHelper.deploy(
        coGatewayConfig.valueToken,
        coGatewayConfig.baseToken,
        coGatewayConfig.anchor,
        coGatewayConfig.bounty,
        gatewayAddress,
        coGatewayConfig.organization,
        coGatewayConfig.messageBus,
        coGatewayConfig.gatewayLib,
        coGatewayDeployParams,
        auxiliaryWeb3
      );
    });

    promiseChain = promiseChain.then(function() {
      let ownerTxParams = Object.assign({}, gatewayDeployParams);
      ownerTxParams.from = gatewayConfig.organizationOwner;
      let coGatewayAddress = coGatewayHelper.address;
      let gatewayAddress = oThis.address;
      oThis.cogateway = coGatewayAddress;
      return oThis.activateGateway(coGatewayAddress, ownerTxParams, gatewayAddress, originWeb3);
    });

    return promiseChain;
  }

  static validateSetupConfig(gatewayConfig) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!gatewayConfig.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set gatewayConfig.deployer address');
    }

    if (!gatewayConfig.organization) {
      throw new Error('Mandatory configuration "organization" missing. Set gatewayConfig.organization address');
    }

    if (!gatewayConfig.anchor) {
      throw new Error('Mandatory configuration "anchor" missing. Set gatewayConfig.anchor address');
    }

    if (!gatewayConfig.bounty) {
      throw new Error('Mandatory configuration "bounty" missing. Set gatewayConfig.bounty address');
    }

    if (!gatewayConfig.messageBus) {
      throw new Error('Mandatory configuration "messageBus" missing. Set gatewayConfig.messageBus address');
    }

    if (!gatewayConfig.gatewayLib) {
      throw new Error('Mandatory configuration "gatewayLib" missing. Set gatewayConfig.gatewayLib address');
    }

    if (!gatewayConfig.valueToken) {
      throw new Error('Mandatory configuration "valueToken" missing. Set gatewayConfig.valueToken address');
    }

    if (!gatewayConfig.baseToken) {
      throw new Error('Mandatory configuration "baseToken" missing. Set gatewayConfig.baseToken address');
    }

    if (!gatewayConfig.organizationOwner) {
      throw new Error(
        'Mandatory configuration "organizationOwner" missing. Set gatewayConfig.organizationOwner address'
      );
    }
  }

  deploy(_token, _baseToken, _anchor, _bounty, _membersManager, messageBusAddress, gatewayLibAddress, txOptions, web3) {
    const oThis = this;

    web3 = web3 || oThis.web3;
    messageBusAddress = messageBusAddress || oThis.messageBus;
    gatewayLibAddress = gatewayLibAddress || oThis.gatewayLib;
    const messageBusLibInfo = {
      address: messageBusAddress,
      name: 'MessageBus'
    };
    const gatewayLibInfo = {
      address: gatewayLibAddress,
      name: 'GatewayLib'
    };

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getLinkedBIN(ContractName, messageBusLibInfo, gatewayLibInfo);

    let defaultOptions = {
      gas: '8000000'
    };
    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const contract = new web3.eth.Contract(abi, null, txOptions);
    const _burner = '0x0000000000000000000000000000000000000000';
    let args = [_token, _baseToken, _anchor, _bounty, _membersManager, _burner];
    let tx = contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

    console.log('* Deploying EIP20Gateway Contract');
    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .then(function(instace) {
        oThis.address = instace.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  activateGateway(_coGatewayAddress, txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;

    let defaultOptions = {
      gas: '2000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    let tx = contract.methods.activateGateway(_coGatewayAddress);

    console.log(`* Activating ${ContractName} with CoGateWay Address: ${_coGatewayAddress}`);
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }
}

module.exports = GatewayHelper;
