'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('../../AbiBinProvider');
const OrganizationHelper = require('./OrganizationHelper');
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

  setup(config, txOptions, web3) {
    const oThis = this;

    CoGatewayHelper.validateSetupConfig(config);

    if (!config.gateway) {
      throw new Error(
        'Mandatory configuration "gateway" missing. Set config.gateway address',
      );
    }

    if (!txOptions) {
      txOptions = txOptions || {};
    }

    if (typeof txOptions.gasPrice === 'undefined') {
      txOptions.gasPrice = '0x5B9ACA00';
    }

    txOptions.from = txOptions.from || config.deployer;

    return oThis.deploy(
      config.valueToken,
      config.utilityToken,
      config.anchor,
      config.bounty,
      config.gateway,
      config.organization,
      config.messageBus,
      config.gatewayLib,
      txOptions,
      web3,
    );
  }

  static validateSetupConfig(config) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!config.deployer) {
      throw new Error(
        'Mandatory configuration "deployer" missing. Set config.deployer address',
      );
    }

    if (!config.bounty) {
      throw new Error(
        'Mandatory configuration "bounty" missing. Set config.bounty address',
      );
    }

    if (!config.organization) {
      throw new Error(
        'Mandatory configuration "organization" missing. Set config.organization address',
      );
    }

    if (!config.anchor) {
      throw new Error(
        'Mandatory configuration "anchor" missing. Set config.anchor address',
      );
    }

    if (!config.messageBus) {
      throw new Error(
        'Mandatory configuration "messageBus" missing. Set config.messageBus address',
      );
    }

    if (!config.gatewayLib) {
      throw new Error(
        'Mandatory configuration "gatewayLib" missing. Set config.gatewayLib address',
      );
    }

    if (!config.valueToken) {
      throw new Error(
        'Mandatory configuration "valueToken" missing. Set config.valueToken address',
      );
    }

    if (!config.utilityToken) {
      throw new Error(
        'Mandatory configuration "utilityToken" missing. Set config.utilityToken address',
      );
    }
  }

  deploy(
    _valueToken,
    _utilityToken,
    _anchor,
    _bounty,
    _membersManager,
    _gateway,
    messageBus,
    gatewayLib,
    txOptions,
    web3,
  ) {
    const oThis = this;

    web3 = web3 || oThis.web3;
    messageBus = messageBus || oThis.messageBus;
    gatewayLib = gatewayLib || oThis.gatewayLib;

    let tx = oThis._deployRawTx(
      _valueToken,
      _utilityToken,
      _anchor,
      _bounty,
      _membersManager,
      _gateway,
      messageBus,
      gatewayLib,
      txOptions,
      web3,
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
        console.log(
          '\t - Receipt:\n\x1b[2m',
          JSON.stringify(receipt),
          '\x1b[0m\n',
        );
      })
      .then(function(instace) {
        oThis.address = instace.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  _deployRawTx(
    _valueToken,
    _utilityToken,
    _anchor,
    _bounty,
    _membersManager,
    _gateway,
    messageBus,
    gatewayLib,
    txOptions,
    web3,
  ) {
    const oThis = this;

    const messageBusLibInfo = {
      address: messageBus,
      name: 'MessageBus',
    };
    const gatewayLibInfo = {
      address: gatewayLib,
      name: 'GatewayLib',
    };

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getLinkedBIN(
      ContractName,
      messageBusLibInfo,
      gatewayLibInfo,
    );

    let defaultOptions = {
      gas: '7500000',
    };
    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const _burner = '0x0000000000000000000000000000000000000000';
    const contract = new web3.eth.Contract(abi, null, txOptions);
    let args = [
      _valueToken,
      _utilityToken,
      _anchor,
      _bounty,
      _membersManager,
      _gateway,
      _burner,
    ];

    return contract.deploy(
      {
        data: bin,
        arguments: args,
      },
      txOptions,
    );
  }
}

module.exports = CoGatewayHelper;
