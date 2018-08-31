'use strict';
const fs = require('fs'),
  os = require('os'),
  Mosaic = require('../index');

const LinkOSTPrimeGateways = function(config) {
  const oThis = this;
  oThis.config = config;
};

LinkOSTPrimeGateways.prototype = {
  perform: async function() {
    let oThis = this;

    let mosiacConfig = oThis._getMosaicConfig(oThis.config);
    let mosaic = new Mosaic('', mosiacConfig);

    let linkConfig = oThis._getLinkConfig(oThis.config);
    mosaic.setup.linkGateways(linkConfig);
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
      originConfig: {
        organization: {
          address: configs.originOrganizationAddress,
          passPhrase: configs.originOrganizationPassphrase
        },
        chainDataPath: configs.originChainDataPath,
        coreContractAddress: configs.originCoreContractAddress,
        outboxPositionIndex: configs.originOutboxPositionIndex
      },
      auxiliaryConfig: {
        organization: {
          address: configs.auxiliaryOrganizationAddress,
          passPhrase: configs.auxiliaryOrganizationPassphrase
        },
        chainDataPath: configs.auxiliaryChainDataPath,
        coreContractAddress: configs.auxiliaryCoreContractAddress,
        outboxPositionIndex: configs.auxiliaryOutboxPositionIndex
      },
      token: {
        name: 'SimpleTokenPrime',
        symbol: 'STP',
        decimal: 18
      }
    };
  }
};

module.exports = LinkOSTPrimeGateways;
