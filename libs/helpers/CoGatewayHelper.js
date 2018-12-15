'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('../../libs/AbiBinProvider');
const ContractName = 'EIP20CoGateway';
class CoGatewayHelper {
  constructor(web3, address, messageBus, gatewayLib) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.messageBus = messageBus;
    oThis.gatewayLib = gatewayLib;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  static validateSetupConfig(coGatewayConfig) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!coGatewayConfig.deployer) {
      throw new Error('Mandatory configuration "deployer" missing. Set coGatewayConfig.deployer address');
    }

    if (!coGatewayConfig.bounty) {
      throw new Error('Mandatory configuration "bounty" missing. Set coGatewayConfig.bounty address');
    }

    if (!coGatewayConfig.organization) {
      throw new Error('Mandatory configuration "organization" missing. Set coGatewayConfig.organization address');
    }

    if (!coGatewayConfig.safeCore) {
      throw new Error('Mandatory configuration "safeCore" missing. Set coGatewayConfig.safeCore address');
    }

    if (!coGatewayConfig.messageBus) {
      throw new Error('Mandatory configuration "messageBus" missing. Set coGatewayConfig.messageBus address');
    }

    if (!coGatewayConfig.gatewayLib) {
      throw new Error('Mandatory configuration "gatewayLib" missing. Set coGatewayConfig.gatewayLib address');
    }

    if (!coGatewayConfig.valueToken) {
      throw new Error('Mandatory configuration "valueToken" missing. Set coGatewayConfig.valueToken address');
    }

    if (!coGatewayConfig.baseToken) {
      throw new Error('Mandatory configuration "baseToken" missing. Set coGatewayConfig.baseToken address');
    }
  }

  deploy(_token, _baseToken, _core, _bounty, _membersManager, _gateway, messageBus, gatewayLib, txOptions, web3) {
    const oThis = this;

    web3 = web3 || oThis.web3;
    messageBus = messageBus || oThis.messageBus;
    gatewayLib = gatewayLib || oThis.gatewayLib;
    const messageBusLibInfo = {
      address: messageBus,
      name: 'MessageBus'
    };
    const gatewayLibInfo = {
      address: gatewayLib,
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
    let args = [_token, _baseToken, _core, _bounty, _membersManager, _gateway];
    let tx = contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

    console.log(`* Deploying ${ContractName} Contract`);
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
}

module.exports = CoGatewayHelper;
