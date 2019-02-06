'use strict';

const { deprecationNoticeChainSetup } = require('./utils/Utils');

const OrganizationHelper = require('./helpers/setup/OrganizationHelper');
const AnchorHelper = require('./helpers/setup/AnchorHelper');
const OSTPrimeHelper = require('./helpers/setup/OSTPrimeHelper');
const LibsHelper = require('./helpers/setup/LibsHelper');
const GatewayHelper = require('./helpers/setup/GatewayHelper');
const CoGatewayHelper = require('./helpers/setup/CoGatewayHelper');

class ChainSetup {
  static get OrganizationHelper() {
    deprecationNoticeChainSetup('ChainSetup.OrganizationHelper');
    return OrganizationHelper;
  }

  static get AnchorHelper() {
    deprecationNoticeChainSetup('ChainSetup.AnchorHelper');
    return AnchorHelper;
  }

  static get OSTPrimeHelper() {
    return OSTPrimeHelper;
  }

  static get LibsHelper() {
    deprecationNoticeChainSetup('ChainSetup.LibsHelper');
    return LibsHelper;
  }

  static get GatewayHelper() {
    deprecationNoticeChainSetup('ChainSetup.GatewayHelper');
    return GatewayHelper;
  }

  static get CoGatewayHelper() {
    deprecationNoticeChainSetup('ChainSetup.CoGatewayHelper');
    return CoGatewayHelper;
  }
}

module.exports = ChainSetup;
