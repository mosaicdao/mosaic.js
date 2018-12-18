'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const OrganizationHelper = require('./helpers/OrganizationHelper');
const AnchorHelper = require('./helpers/AnchorHelper');
const OSTPrimeHelper = require('./helpers/OSTPrimeHelper');
const LibsHelper = require('./helpers/LibsHelper');
const GatewayHelper = require('./helpers/GatewayHelper');
const CoGatewayHelper = require('./helpers/GatewayHelper');

class ChainSetup {
  constructor(originWeb3, auxiliaryWeb3) {
    this.originWeb3 = originWeb3;
    this.auxiliaryWeb3 = auxiliaryWeb3;
  }
  setup(simpleTokenAddress, originConfig, auxiliaryConfig, originWeb3, auxiliaryWeb3) {
    const oThis = this;
    const outAddresses = {
      origin: {},
      auxiliary: {}
    };

    /*
      Steps:
        set orig.valueToken = simpleTokenAddress;

        - Setup Anchors: 
          - On Auxiliary: (call oThis.setupAnchor )
            - Deploy Organization on Aux => aux.anchorOrganization
            - Deploy Anchor on Aux with aux.anchorOrganization => aux.anchor
          - On Origin: (call oThis.setupAnchor )
            - Deploy Organization on Origin => orig.anchorOrganization
            - Deploy Anchor on Origin with orig.anchorOrganization => orig.anchor

        - Set CoAnchors: (call oThis.setCoAnchors )
          - On Auxiliary: 
            - Set coAnchor - orig.anchor address with aux.anchor
          - On Origin:
            - Set coAnchor - aux.anchor address with orig.anchor 

         //------------------- THE PART BELOW COMMON FOR ECONOMY SETUP -------------------//     
        - Setup Organizations & Libs:
          - On Auxiliary:
            - Deploy Organization on Aux => aux.organization (call oThis.setupOrganization )
            - Deploy Libs => aux.libs (Note all addresses) ( call oThis.setupLibs )
          - On Origin:
            - Deploy Organization on Origin => orig.organization (call oThis.setupOrganization )
            - Deploy Libs => orig.libs (Note all addresses) ( call oThis.setupLibs )

        - Setup UtilityToken (call oThis.setupUtilityToken(simpleTokenAddress, ...) 
          - On Auxiliary:
            - Deploy UtilityToken (OSTPrime) on Aux with aux.organization => aux.utilityToken
            * In case of Economy-Setup deploy UtilityBrandedToken

        - Setup Gateways (call oThis.setupGateways )
          - On Origin:
            - Deploy Gateway with orig.valueToken, orig.organization & orig.libs => orig.gateway
          - On Auxiliary:
            - Deploy CoGateway with aux.utilityToken, aux.organization, aux.libs & orig.gateway => aux.coGateway
          - On Origin:
            - activateGateway with aux.coGateway 
    */
  }

  setupAnchor(orgConfig, anchorConfig, txOptions, web3, coWeb3) {
    const oThis = this;
    //IMPORTANT: THIS IS STUB CODE. Altough, it may work as is.

    //orgConfig -> Organization setup config.
    //anchorConfig -> Anchor setup config.

    let anchorHelper = new AnchorHelper(web3, coWeb3);
    let orgAddress, anchorAddress;
    return oThis
      .setupOrganization(orgConfig, txOptions, web3)
      .then(function(address) {
        orgAddress = address;
        anchorConfig.organization = orgAddress;
        return anchorHelper.setup(anchorConfig);
      })
      .then(function() {
        return {
          anchorOrganization: orgAddress,
          anchor: anchorAddress,
          anchorHelper: anchorHelper
        };
      });
  }

  setCoAnchors(originAnchorHelper, auxAnchorHelper) {
    const oThis = this;
    //IMPORTANT: THIS IS STUB CODE. Altough, it may work as is.

    return originAnchorHelper.setCoAnchorAddress(auxAnchorHelper.address).then(function() {
      return auxAnchorHelper.setCoAnchorAddress(originAnchorHelper.address);
    });
  }

  setupOrganization(config, txOptions, web3) {
    const oThis = this;
    //IMPORTANT: THIS IS STUB CODE. Altough, it may work as is.

    let orgHelper = new OrganizationHelper(web3);
    return orgHelper.setup(config, txOptions).then(function() {
      return orgHelper.address;
    });
  }

  setupLibs(config, txOptions, web3) {
    const oThis = this;
    //IMPORTANT: THIS IS STUB CODE. Altough, it may work as is.

    let libsHelper = new LibsHelper(web3);
    return libsHelper.setup(config, txOptions, web3).then(function() {
      return {
        merklePatriciaProof: libsHelper.merklePatriciaProof,
        messageBus: libsHelper.messageBus,
        gatewayLib: libsHelper.gatewayLib
      };
    });
  }

  setupUtilityToken(valueToken, config, txOptions, web3) {
    const oThis = this;
    //IMPORTANT - Do not change the name of the method.
    //This economy-setup script shell derive from this script and override this method to deploy UBT.
    //Also, OSTPrime is UtilityToken.

    //IMPORTANT: THIS IS STUB CODE. Altough, it may work as is.
    let ostPrimeHelper = new OSTPrimeHelper();
    return ostPrimeHelper.setup(valueToken, config, txOptions, web3).then(function() {
      return ostPrimeHelper.address;
    });
  }

  setupGateways(
    libs,
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
    //IMPORTANT: THIS IS STUB CODE.
    let gatewayHelper = new GatewayHelper();
    return gatewayHelper
      .setup(
        valueToken,
        baseToken,
        gatewayConfig,
        coGatewayConfig,
        gatewayTxOptions,
        coGatewayTxOptions,
        originWeb3,
        auxiliaryWeb3
      )
      .then(function() {
        return {
          gateway: gatewayHelper.address,
          cogateway: gatewayHelper.cogateway
        };
      });
  }

  static get OrganizationHelper() {
    return OrganizationHelper;
  }

  static get AnchorHelper() {
    return AnchorHelper;
  }

  static get OSTPrimeHelper() {
    return OSTPrimeHelper;
  }

  static get LibsHelper() {
    return LibsHelper;
  }
}

module.exports = ChainSetup;
