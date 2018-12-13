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
    oThis.messageBusAddress = messageBusAddress;
    oThis.gatewayLibAddress = gatewayLibAddress;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  /*
  //gatewayConfig
  {
    "deployer": "0x...",
    "organization": "0x...",
    "safeCore": "0x....",
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
    "safeCore": "0x....",
    "bounty": "123456",
    "messageBus": "0x....",
    "gatewayLib": "0x....",
    "ostPrime": "0x...."
  }
*/
  setup(gatewayConfig, coGatewayConfig, gatewayTxOptions, coGatewayTxOptions, originWeb3, auxiliaryWeb3) {
    const oThis = this;
    originWeb3 = originWeb3 || oThis.web3;

    if (!gatewayConfig) {
      throw new Error('Mandatory parameter "gatewayConfig" missing. ');
    }
    if (!coGatewayConfig) {
      throw new Error('Mandatory parameter "coGatewayConfig" missing. ');
    }

    gatewayConfig = gatewayConfig || {};
    gatewayConfig.messageBus = gatewayConfig.messageBus || oThis.messageBusAddress;
    gatewayConfig.gatewayLib = gatewayConfig.gatewayLib || oThis.gatewayLibAddress;

    if (!originWeb3) {
      throw new Error('Mandatory parameter "originWeb3" missing.');
    }

    if (!auxiliaryWeb3) {
      throw new Error('Mandatory parameter "auxiliaryWeb3" missing.');
    }

    if (!gatewayConfig.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set gatewayConfig.deployer address');
    }

    if (!coGatewayConfig.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set coGatewayConfig.deployer address');
    }

    if (!gatewayConfig.organization) {
      throw new Error('Mandatory configuration "organization" missing. Set gatewayConfig.organization address');
    }

    if (!coGatewayConfig.organization) {
      throw new Error('Mandatory configuration "organization" missing. Set coGatewayConfig.organization address');
    }

    if (!gatewayConfig.safeCore) {
      throw new Error('Mandatory configuration "safeCore" missing. Set gatewayConfig.safeCore address');
    }

    if (!coGatewayConfig.safeCore) {
      throw new Error('Mandatory configuration "safeCore" missing. Set coGatewayConfig.safeCore address');
    }

    if (!gatewayConfig.bounty) {
      throw new Error('Mandatory configuration "bounty" missing. Set gatewayConfig.bounty address');
    }

    if (!coGatewayConfig.bounty) {
      throw new Error('Mandatory configuration "bounty" missing. Set coGatewayConfig.bounty address');
    }

    if (!gatewayConfig.messageBus) {
      throw new Error('Mandatory configuration "messageBus" missing. Set gatewayConfig.messageBus address');
    }

    if (!coGatewayConfig.messageBus) {
      throw new Error('Mandatory configuration "messageBus" missing. Set coGatewayConfig.messageBus address');
    }

    if (!gatewayConfig.gatewayLib) {
      throw new Error('Mandatory configuration "gatewayLib" missing. Set gatewayConfig.gatewayLib address');
    }

    if (!coGatewayConfig.gatewayLib) {
      throw new Error('Mandatory configuration "gatewayLib" missing. Set coGatewayConfig.gatewayLib address');
    }

    if (!gatewayConfig.simpleToken) {
      throw new Error('Mandatory configuration "simpleToken" missing. Set gatewayConfig.simpleToken address');
    }

    if (!coGatewayConfig.ostPrime) {
      throw new Error('Mandatory configuration "ostPrime" missing. Set coGatewayConfig.ostPrime address');
    }

    if (!gatewayConfig.organizationOwner) {
      throw new Error(
        'Mandatory configuration "organizationOwner" missing. Set gatewayConfig.organizationOwner address'
      );
    }

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
      gatewayConfig.simpleToken,
      gatewayConfig.simpleToken,
      gatewayConfig.safeCore,
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
        coGatewayConfig.ostPrime,
        coGatewayConfig.ostPrime,
        coGatewayConfig.safeCore,
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
      return oThis.activateGateway(coGatewayAddress, ownerTxParams, gatewayAddress, originWeb3);
    });

    return promiseChain;
  }

  deploy(_token, _baseToken, _core, _bounty, _membersManager, messageBusAddress, gatewayLibAddress, txOptions, web3) {
    const oThis = this;

    web3 = web3 || oThis.web3;
    messageBusAddress = messageBusAddress || oThis.messageBusAddress;
    gatewayLibAddress = gatewayLibAddress || oThis.gatewayLibAddress;
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
    let args = [_token, _baseToken, _core, _bounty, _membersManager];
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
