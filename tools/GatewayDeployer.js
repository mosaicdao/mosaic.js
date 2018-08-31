'use strict';

const fs = require('fs'),
  shell = require('shelljs');

const originPassphrase = 'testtest',
  auxiliaryPassphrase = 'testtest';

const Mosaic = require('../index');

const GatewayDeployer = function(config) {
  const oThis = this;

  oThis.config = config;

  let mosaicConfig = {
    origin: {
      provider: oThis.config.originGethRpcEndPoint
    },
    auxiliaries: [
      {
        provider: oThis.config.auxiliaryGethRpcEndPoint,
        originCoreContractAddress: oThis.config.originCoreContractAddress
      }
    ]
  };

  oThis.mosaic = new Mosaic('', mosaicConfig);
};

GatewayDeployer.prototype = {
  deploy: async function() {
    const oThis = this;
    let config = oThis.config;

    let originConfig: {
        coreAddress: config.originCoreContractAddress,
        deployerAddress: config.originDeployerAddress,
        deployerPassPhrase: originPassphrase,
        gasPrice: config.originGasPrice,
        gasLimit: config.originGasLimit,
        token: config.erc20TokenContractAddress,
        bounty: 0,
        organisationAddress: config.originOrganizationAddress,
        messageBusAddress: config.originMessageBusContractAddress
      },
      //auxiliary
      auxiliaryConfig: {
        coreAddress: config.auxiliaryCoreContractAddress,
        deployerAddress: config.auxiliaryDeployerAddress,
        deployerPassPhrase: auxiliaryPassphrase,
        gasPrice: config.auxiliaryGasPrice,
        gasLimit: config.auxiliaryGasLimit,
        token: config.stPrimeContractAddress,
        bounty: 0,
        organisationAddress: config.auxiliaryOrganizationAddress,
        messageBusAddress: config.auxiliaryMessageBusContractAddress
      };

    console.log('origin config  ', originConfig);
    console.log('auxiliary Config   ', auxiliaryConfig);

    let MosaicGatewayDeployer = oThis.mosaic.setup.GatewayDeployer,
      gateDeployer = new MosaicGatewayDeployer(originConfig, auxiliaryConfig);
    let deployResult = await gateDeployer.deploy();
    console.log(
      ` gateway ${deployResult.gateway.receipt.contractAddress} , co-gateway ${
        deployResult.cogateway.receipt.contractAddress
      }`
    );
  },

  _addConfig: function(params) {
    const oThis = this;

    let fileContent = JSON.parse(fs.readFileSync(oThis.configJsonFilePath, 'utf8'));

    for (var i in params) {
      fileContent[i] = params[i];
    }

    oThis._executeInShell("echo '" + JSON.stringify(fileContent) + "' > " + oThis.configJsonFilePath);
  },

  _executeInShell: function(cmd) {
    let res = shell.exec(cmd);

    if (res.code !== 0) {
      shell.exit(1);
    }

    return res;
  }
};

module.exports = GatewayDeployer;
