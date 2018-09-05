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
  let mosiacConfig = oThis._getMosaicConfig(oThis.config);
  oThis.mosaic = new Mosaic('', mosiacConfig);
  oThis._setSigner();
};

LinkOSTPrimeGateways.prototype = {
  perform: async function() {
    let oThis = this;
    let linkConfig = oThis._getLinkConfig(oThis.config);
    await oThis.mosaic.setup.linkGateways(linkConfig).catch((error) => console.log(error));
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
  },

  _setSigner: function() {
    //We will use the geth Signer here.
    let oThis = this,
      config = oThis.config,
      mosaic = oThis.mosaic;

    let originGethSigner = new mosaic.utils.GethSignerService(mosaic.origin());
    originGethSigner.addAccount(config.originOrganizationAddress, ORIGIN_ORGANISATION_PASSPHRASE);
    originGethSigner.addAccount(config.originWorkerAddress, ORIGIN_ORGANISATION_PASSPHRASE);

    mosaic.signers.setOriginSignerService(originGethSigner);

    let auxiliaryGethSigner = new mosaic.utils.GethSignerService(mosaic.core(config.originCoreContractAddress));
    auxiliaryGethSigner.addAccount(config.auxiliaryOrganizationAddress, AUXILIARY_ORGANISATION_PASSPHRASE);
    auxiliaryGethSigner.addAccount(config.auxiliaryWorkerAddress, AUXILIARY_ORGANISATION_PASSPHRASE);

    mosaic.signers.setAuxiliarySignerService(auxiliaryGethSigner, config.originCoreContractAddress);
  }
};

module.exports = LinkOSTPrimeGateways;
