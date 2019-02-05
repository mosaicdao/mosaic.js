'use strict';

const AbiBinProvider = require('../../AbiBinProvider');
const CoGatewayHelper = require('./CoGatewayHelper');
const EIP20CoGateway = require('../../ContractInteract/EIP20CoGateway');

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
    "token": "0x...",
    "baseToken": "0x...",
    "organization": "0x...",
    "anchor": "0x....",
    "bounty": "123456",
    "messageBus": "0x....",
    "gatewayLib": "0x....",
    "ostPrime": "0x...."
  }
*/
  setup(
    gatewayConfig,
    coGatewayConfig,
    gatewayTxOptions,
    coGatewayTxOptions,
    originWeb3,
    auxiliaryWeb3,
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

    if (!originWeb3) {
      throw new Error('Mandatory parameter "originWeb3" missing.');
    }

    if (!auxiliaryWeb3) {
      throw new Error('Mandatory parameter "auxiliaryWeb3" missing.');
    }

    if (!gatewayConfig.baseToken) {
      throw new Error(
        'Mandatory configuration "baseToken" missing. Set gatewayConfig.baseToken address',
      );
    }

    GatewayHelper.validateSetupConfig(gatewayConfig);
    EIP20CoGateway.validateSetupConfig(coGatewayConfig);

    if (!gatewayTxOptions) {
      gatewayTxOptions = gatewayTxOptions || {};
    }

    if (typeof gatewayTxOptions.gasPrice === 'undefined') {
      gatewayTxOptions.gasPrice = '0x5B9ACA00';
    }

    let gatewayDeployParams = Object.assign({}, gatewayTxOptions);
    gatewayDeployParams.from = gatewayConfig.deployer;

    let promiseChain = oThis.deploy(
      gatewayConfig.token,
      gatewayConfig.baseToken,
      gatewayConfig.anchor,
      gatewayConfig.bounty,
      gatewayConfig.organization,
      gatewayConfig.messageBus,
      gatewayConfig.gatewayLib,
      gatewayDeployParams,
      originWeb3,
    );

    promiseChain = promiseChain.then(function() {
      let gatewayAddress = oThis.address;
      coGatewayConfig.gateway = gatewayAddress;
      return EIP20CoGateway.setup(
        auxiliaryWeb3,
        coGatewayConfig,
        coGatewayTxOptions,
      );
    });

    promiseChain = promiseChain.then(function(coGateway) {
      let ownerTxParams = Object.assign({}, gatewayDeployParams);
      ownerTxParams.from = gatewayConfig.organizationOwner;
      let coGatewayAddress = coGateway.address;
      let gatewayAddress = oThis.address;
      oThis.cogateway = coGatewayAddress;
      return oThis.activateGateway(
        coGatewayAddress,
        ownerTxParams,
        gatewayAddress,
        originWeb3,
      );
    });

    promiseChain = promiseChain.then(async function() {
      let gatewayAddress = oThis.address;
      oThis.stakeVault = await oThis.getStakeVault(gatewayAddress, originWeb3);
      return Promise.resolve({});
    });

    return promiseChain;
  }

  static validateSetupConfig(gatewayConfig) {
    console.log(`* Validating ${ContractName} Setup Config.`);
    if (!gatewayConfig.deployer) {
      throw new Error(
        'Mandatory configuration "deployer" missing. Set gatewayConfig.deployer address',
      );
    }

    if (!gatewayConfig.organization) {
      throw new Error(
        'Mandatory configuration "organization" missing. Set gatewayConfig.organization address',
      );
    }

    if (!gatewayConfig.anchor) {
      throw new Error(
        'Mandatory configuration "anchor" missing. Set gatewayConfig.anchor address',
      );
    }

    if (!gatewayConfig.bounty) {
      throw new Error(
        'Mandatory configuration "bounty" missing. Set gatewayConfig.bounty address',
      );
    }

    if (!gatewayConfig.messageBus) {
      throw new Error(
        'Mandatory configuration "messageBus" missing. Set gatewayConfig.messageBus address',
      );
    }

    if (!gatewayConfig.gatewayLib) {
      throw new Error(
        'Mandatory configuration "gatewayLib" missing. Set gatewayConfig.gatewayLib address',
      );
    }

    if (!gatewayConfig.token) {
      throw new Error(
        'Mandatory configuration "token" missing. Set gatewayConfig.token address',
      );
    }

    if (!gatewayConfig.organizationOwner) {
      throw new Error(
        'Mandatory configuration "organizationOwner" missing. Set gatewayConfig.organizationOwner address',
      );
    }
  }

  deploy(
    _token,
    _baseToken,
    _anchor,
    _bounty,
    _membersManager,
    messageBusAddress,
    gatewayLibAddress,
    txOptions,
    web3,
  ) {
    const oThis = this;

    web3 = web3 || oThis.web3;
    messageBusAddress = messageBusAddress || oThis.messageBus;
    gatewayLibAddress = gatewayLibAddress || oThis.gatewayLib;

    let tx = oThis._deployRawTx(
      _token,
      _baseToken,
      _anchor,
      _bounty,
      _membersManager,
      messageBusAddress,
      gatewayLibAddress,
      txOptions,
      web3,
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
    _token,
    _baseToken,
    _anchor,
    _bounty,
    _membersManager,
    messageBusAddress,
    gatewayLibAddress,
    txOptions,
    web3,
  ) {
    const oThis = this;

    const messageBusLibInfo = {
      address: messageBusAddress,
      name: 'MessageBus',
    };
    const gatewayLibInfo = {
      address: gatewayLibAddress,
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

    const contract = new web3.eth.Contract(abi, null, txOptions);
    const _burner = '0x0000000000000000000000000000000000000000';
    let args = [
      _token,
      _baseToken,
      _anchor,
      _bounty,
      _membersManager,
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

  activateGateway(_coGatewayAddress, txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;

    let tx = oThis._activateGatewayRawTx(
      _coGatewayAddress,
      txOptions,
      contractAddress,
      web3,
    );

    console.log(
      `* Activating ${ContractName} with CoGateWay Address: ${_coGatewayAddress}`,
    );

    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log(
          '\t - Receipt:\n\x1b[2m',
          JSON.stringify(receipt),
          '\x1b[0m\n',
        );
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  _activateGatewayRawTx(_coGatewayAddress, txOptions, contractAddress, web3) {
    const oThis = this;

    let defaultOptions = {
      gas: '2000000',
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);

    return contract.methods.activateGateway(_coGatewayAddress);
  }

  getStakeVault(gatewayContractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, gatewayContractAddress);

    return contract.methods.stakeVault().call(function(err, res) {
      if (err) return Promise.reject(err);
      return Promise.resolve(res);
    });
  }
}

module.exports = GatewayHelper;
