'use strict';
const fs = require('fs'),
  Mosaic = require('../index');

const ORIGIN_ORGANISATION_PASSPHRASE = 'testtest';
const AUXILIARY_ORGANISATION_PASSPHRASE = 'testtest';

const LinkOSTPrimeGateways = function(config, configOutputPath) {
  const oThis = this;
  oThis.config = config;

  //Temp Code. ToDo: Assign oThis.config & use oThis.config object instead of configFileContent.
  oThis.configJsonFilePath = configOutputPath;
  oThis.config = JSON.parse(fs.readFileSync(configOutputPath, 'utf8'));
};

LinkOSTPrimeGateways.prototype = {
  perform: async function() {
    let oThis = this;

    let mosiacConfig = oThis._getMosaicConfig(oThis.config);
    let mosaic = new Mosaic('', mosiacConfig);

    let linkConfig = oThis._getLinkConfig(oThis.config);

    await mosaic.setup.linkGateways(linkConfig);
  },

  _getMosaicConfig: function(configs) {
    return {
      origin: {
        provider: configs.originGethRpcEndPoint
      },
      auxiliaries: [
        {
          provider: configs.auxiliaryGethRpcEndPoint,
          originCoreContractAddress: configs.originCoreContractAddress
        }
      ]
    };
  },

  _getLinkConfig: function(configs) {
    return {
      origin: {
        organization: {
          address: configs.originOrganizationAddress,
          passPhrase: ORIGIN_ORGANISATION_PASSPHRASE
        },
        chainDataPath: configs.originChainDataPath,
        coreContractAddress: configs.originCoreContractAddress,
        outboxPositionIndex: configs.originOutboxPositionIndex,
        gatewayAddress: configs.gatewayAddress
      },
      auxiliary: {
        organization: {
          address: configs.auxiliaryOrganizationAddress,
          passPhrase: AUXILIARY_ORGANISATION_PASSPHRASE
        },
        chainDataPath: configs.auxiliaryChainDataPath,
        coreContractAddress: configs.auxiliaryCoreContractAddress,
        outboxPositionIndex: configs.auxiliaryOutboxPositionIndex,
        coGatewayAddress: configs.coGatewayAddress,
        workerAddress: configs.auxiliaryWorkerAddress
      },
      token: {
        name: 'Mock Token',
        symbol: 'MOCK',
        decimal: 18
      }
    };
  }
};

module.exports = LinkOSTPrimeGateways;
