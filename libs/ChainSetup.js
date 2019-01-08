'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const OrganizationHelper = require('./helpers/OrganizationHelper');
const AnchorHelper = require('./helpers/AnchorHelper');
const OSTPrimeHelper = require('./helpers/OSTPrimeHelper');
const LibsHelper = require('./helpers/LibsHelper');
const GatewayHelper = require('./helpers/GatewayHelper');
const CoGatewayHelper = require('./helpers/CoGatewayHelper');

class ChainSetup {
  constructor(originWeb3, auxiliaryWeb3) {
    this.originWeb3 = originWeb3;
    this.auxiliaryWeb3 = auxiliaryWeb3;
  }

  setup(simpleTokenAddress, originConfig, auxiliaryConfig, originWeb3, auxiliaryWeb3) {
    const oThis = this;
    originWeb3 = originWeb3 || oThis.originWeb3;
    auxiliaryWeb3 = auxiliaryWeb3 || oThis.auxiliaryWeb3;

    const outAddresses = {
      origin: {},
      auxiliary: {}
    };

    let originTxOptions = {
      gasPrice: originConfig.gasPrice || '0x5B9ACA00'
    };

    let auxTxOptions = {
      gasPrice: originConfig.gasPrice || '0x0'
    };

    if (typeof simpleTokenAddress !== 'string') {
      throw new Error('Mandatory parameter "simpleTokenAddress" address missing.');
    }

    let promiseChain = new Promise(function(resolve, reject) {
      resolve(simpleTokenAddress);
    }).then(function(simpleTokenAddress) {
      //Update Address Book
      let addresses = outAddresses.origin;
      addresses.token = simpleTokenAddress;
    });

    //A. Deploy (Token) Organization [Orig]
    promiseChain = oThis.setupTokenOrganizationOnOrigin(
      promiseChain,
      originWeb3,
      originConfig,
      originTxOptions,
      outAddresses
    );

    //B. Deploy Utility Token
    promiseChain = oThis.setupToken(
      promiseChain,
      auxiliaryWeb3,
      auxiliaryConfig,
      auxTxOptions,
      simpleTokenAddress,
      outAddresses
    );

    //C. Deploy and Prepare Anchors
    promiseChain = oThis.setupAnchor(
      promiseChain,
      originWeb3,
      auxiliaryWeb3,
      originConfig,
      auxiliaryConfig,
      originTxOptions,
      auxTxOptions,
      outAddresses
    );

    //D. Deploy Libs
    promiseChain = oThis.setupLibs(
      promiseChain,
      originWeb3,
      auxiliaryWeb3,
      originConfig,
      auxiliaryConfig,
      originTxOptions,
      auxTxOptions,
      outAddresses
    );

    //E. Deploy Gateways
    promiseChain = oThis.setupGateways(
      promiseChain,
      originWeb3,
      auxiliaryWeb3,
      originConfig,
      auxiliaryConfig,
      originTxOptions,
      auxTxOptions,
      simpleTokenAddress,
      outAddresses
    );

    promiseChain = oThis.setGatewayAddresses(
      promiseChain,
      originWeb3,
      auxiliaryWeb3,
      originConfig,
      auxiliaryConfig,
      originTxOptions,
      auxTxOptions,
      outAddresses
    );

    /*
          |---------------------------------------|---------------------------------------|
          |            Chain-Setup                |               Economy-Setup           |
          |---------------------------------------|---------------------------------------|
          |                       A. Deploy and Prepare Origin EIP-20                     |
          |---------------------------------------|---------------------------------------|
          | 1. Deploy (Token) Organization [Orig] | 1. Deploy (Token) Organization [Orig] |
          | 2. Deploy MockSimpleToken [Orig]      | 2. Deploy Branded Token [Orig]        |
          | * On Mainnet SimpleToken is           |                                       |
          |   already deployed.                   |                                       |
          |---------------------------------------|---------------------------------------|
          |                          B. Deploy Utility Token                              |
          |---------------------------------------|---------------------------------------|
          | 1. Deploy (Token) Organization [Aux]  | 1. Deploy (Token) Organization [Aux]  |
          | 2. Deploy OSTPrime [Aux]              | 2. Deploy Utility Branded Token [Aux] |
          |---------------------------------------|---------------------------------------|
          |                      C. Deploy and Prepare Anchors                            |
          |---------------------------------------|---------------------------------------|
          | 1. Deploy (Anchor) Organization [Orig]| * Do nothing, get address of Anchors  |
          | 2. Deploy Anchor [Orig]               |   deployed during chain-setup         |
          | 3. Deploy (Anchor) Organization [Aux] |                                       |
          | 4. Deploy Anchor & set co-anchor      |                                       |
          |    address. [Aux]                     |                                       |
          | 5. Set Co-Anchor address [Orig]       |                                       |
          |---------------------------------------|---------------------------------------|
          |                               D. Deploy Libs                                  |
          |---------------------------------------|---------------------------------------|
          | 1. Deply MerklePatriciaProof [Both]   | 1. Deply MerklePatriciaProof [Both]   |
          | 2. Deploy MessageBus [Both]           | 2. Deploy MessageBus [Both]           |
          | 3. Deploy GatewayLib [Both]           | 3. Deploy GatewayLib [Both]           |
          |---------------------------------------|---------------------------------------|
          |                             E.  Deploy Gateways                               |
          |---------------------------------------|---------------------------------------|
          | 1. Deploy Gateway [Orig]              | 1. Deploy Gateway [Orig]              |
          | 2. Deploy Cogateway [Aux]             | 2. Deploy Cogateway [Aux]             |
          | 3. Activate Gateway [Orig]            | 3. Activate Gateway [Orig]            |
          |---------------------------------------|---------------------------------------|
          |                        F.  Set Gateway Addresses                              |
          |---------------------------------------|---------------------------------------|
          | 1. Set CoGateway in OSTPrime [Aux]    | 1. Set CoGateway in UBT               |
          |                                       | 2. Set Gateway in BT [Orig]           |
          |                                       |    (liftRestriction)                  |
          |---------------------------------------|---------------------------------------|

    */

    promiseChain = oThis.finishSetup(promiseChain, originConfig, auxiliaryConfig, outAddresses);

    return promiseChain;
  }

  setupTokenOrganizationOnOrigin(promiseChain, originWeb3, originConfig, originTxOptions, outAddresses) {
    const oThis = this;

    return promiseChain
      .then(function() {
        let web3 = originWeb3;
        let helper = new OrganizationHelper(web3);
        let config = originConfig.tokenOrganization;
        let txOptions = Object.assign({}, originTxOptions);

        return helper.setup(config, txOptions).then(function() {
          //Figure out how to get address from helper.
          let address = helper.address;
          return address;
        });
      })
      .then(function(orgAddress) {
        //Update Address Book
        let addresses = outAddresses.origin;
        addresses.tokenOrganization = orgAddress;
      });
  }

  setupToken(promiseChain, auxiliaryWeb3, auxiliaryConfig, auxTxOptions, simpleTokenAddress, outAddresses) {
    const oThis = this;

    //B.1. Deploy (Token) Organization [Aux]
    promiseChain = oThis.setupTokenOrganizationOnAux(
      promiseChain,
      auxiliaryWeb3,
      auxiliaryConfig,
      auxTxOptions,
      outAddresses
    );

    //B.2. Deploy OSTPrime [Aux]
    promiseChain = oThis.setupTokenOnAux(
      promiseChain,
      auxiliaryWeb3,
      auxiliaryConfig,
      auxTxOptions,
      outAddresses,
      simpleTokenAddress
    );

    return promiseChain;
  }

  setupTokenOrganizationOnAux(promiseChain, auxiliaryWeb3, auxiliaryConfig, auxTxOptions, outAddresses) {
    const oThis = this;

    return promiseChain
      .then(function() {
        let web3 = auxiliaryWeb3;
        let helper = new OrganizationHelper(web3);
        let config = auxiliaryConfig.tokenOrganization;
        let txOptions = Object.assign({}, auxTxOptions);

        return helper.setup(config, txOptions).then(function() {
          //Figure out how to get address from helper.
          let address = helper.address;
          return address;
        });
      })
      .then(function(orgAddress) {
        //Update Address Book
        let addresses = outAddresses.auxiliary;
        addresses.tokenOrganization = orgAddress;
      });
  }

  setupTokenOnAux(promiseChain, auxiliaryWeb3, auxiliaryConfig, auxTxOptions, outAddresses, simpleTokenAddress) {
    const oThis = this;

    return promiseChain
      .then(function() {
        let web3 = auxiliaryWeb3;
        let helper = new OSTPrimeHelper(web3);
        let config = auxiliaryConfig.ostPrime;
        let txOptions = Object.assign({}, auxTxOptions);

        //Update config as needed.
        config.organization = outAddresses.auxiliary.tokenOrganization;

        return helper.setup(simpleTokenAddress, config, txOptions, web3).then(function() {
          //Figure out how to get address from helper.
          let address = helper.address;
          return address;
        });
      })
      .then(function(ostPrimeAddress) {
        //Update Address Book
        let addresses = outAddresses.auxiliary;
        addresses.token = ostPrimeAddress;
      });
  }

  setupAnchor(
    promiseChain,
    originWeb3,
    auxiliaryWeb3,
    originConfig,
    auxiliaryConfig,
    originTxOptions,
    auxTxOptions,
    outAddresses
  ) {
    const oThis = this;

    //C.1. Deploy (Anchor) Organization [Orig]
    promiseChain = oThis.setupAnchorOrganizationOnOrigin(
      promiseChain,
      originWeb3,
      originConfig,
      originTxOptions,
      outAddresses
    );

    //C.2. Deploy Anchor [Orig]
    promiseChain = oThis.setupAnchorOnOrigin(
      promiseChain,
      originWeb3,
      auxiliaryWeb3,
      originConfig,
      originTxOptions,
      outAddresses
    );

    //C.3. Deploy (Anchor) Organization [Aux]
    promiseChain = oThis.setupAnchorOrganizationOnAux(
      promiseChain,
      auxiliaryWeb3,
      auxiliaryConfig,
      auxTxOptions,
      outAddresses
    );

    //C.4. Deploy Anchor & set co-anchor address. [Aux]
    promiseChain = oThis.setupAnchorOnAux(
      promiseChain,
      auxiliaryWeb3,
      originWeb3,
      originConfig,
      auxiliaryConfig,
      auxTxOptions,
      outAddresses
    );

    //C.5. Set Co-Anchor address [Orig]
    promiseChain = oThis.setupCoAnchorAddress(
      promiseChain,
      originWeb3,
      auxiliaryWeb3,
      originConfig,
      originTxOptions,
      outAddresses
    );

    return promiseChain;
  }

  setupAnchorOrganizationOnOrigin(promiseChain, originWeb3, originConfig, originTxOptions, outAddresses) {
    const oThis = this;

    return promiseChain
      .then(function() {
        let web3 = originWeb3;
        let helper = new OrganizationHelper(web3);
        let config = originConfig.anchorOrganization;
        let txOptions = Object.assign({}, originTxOptions);

        return helper.setup(config, txOptions).then(function() {
          //Figure out how to get address from helper.
          let address = helper.address;
          return address;
        });
      })
      .then(function(orgAddress) {
        //Update Address Book
        let addresses = outAddresses.origin;
        addresses.anchorOrganization = orgAddress;
      });
  }

  setupAnchorOnOrigin(promiseChain, originWeb3, auxiliaryWeb3, originConfig, originTxOptions, outAddresses) {
    const oThis = this;

    return promiseChain
      .then(function() {
        let web3 = originWeb3;
        let coWeb3 = auxiliaryWeb3;
        let helper = new AnchorHelper(web3, coWeb3);
        let config = originConfig.anchor;
        let txOptions = Object.assign({}, originTxOptions);

        //update config  as needed
        config.organization = outAddresses.origin.anchorOrganization;
        config.organizationOwner = config.organizationOwner || originConfig.anchorOrganization.owner;

        return helper.setup(config, txOptions).then(function() {
          //Figure out how to get address from helper.
          let address = helper.address;
          return address;
        });
      })
      .then(function(orgAddress) {
        //Update Address Book
        let addresses = outAddresses.origin;
        addresses.anchor = orgAddress;
      });
  }

  setupAnchorOrganizationOnAux(promiseChain, auxiliaryWeb3, auxiliaryConfig, auxTxOptions, outAddresses) {
    const oThis = this;

    return promiseChain
      .then(function() {
        let web3 = auxiliaryWeb3;
        let helper = new OrganizationHelper(web3);
        let config = auxiliaryConfig.anchorOrganization;
        let txOptions = Object.assign({}, auxTxOptions);

        return helper.setup(config, txOptions).then(function() {
          //Figure out how to get address from helper.
          let address = helper.address;
          return address;
        });
      })
      .then(function(orgAddress) {
        //Update Address Book
        let addresses = outAddresses.auxiliary;
        addresses.anchorOrganization = orgAddress;
      });
  }

  setupAnchorOnAux(promiseChain, auxiliaryWeb3, originWeb3, originConfig, auxiliaryConfig, auxTxOptions, outAddresses) {
    const oThis = this;

    return promiseChain
      .then(function() {
        let web3 = auxiliaryWeb3;
        let coWeb3 = originWeb3;
        let helper = new AnchorHelper(web3, coWeb3);
        let config = originConfig.anchor;
        let txOptions = Object.assign({});

        //update config  as needed
        config.organization = outAddresses.auxiliary.anchorOrganization;
        config.organizationOwner = config.organizationOwner || auxiliaryConfig.anchorOrganization.owner;
        config.coAnchorAddress = outAddresses.origin.anchor;

        return helper.setup(config, txOptions).then(function() {
          //Figure out how to get address from helper.
          let address = helper.address;
          return address;
        });
      })
      .then(function(anchorAddress) {
        //Update Address Book
        let addresses = outAddresses.auxiliary;
        addresses.anchor = anchorAddress;
      });
  }

  setupCoAnchorAddress(promiseChain, originWeb3, auxiliaryWeb3, originConfig, originTxOptions, outAddresses) {
    const oThis = this;

    return promiseChain.then(function() {
      let web3 = originWeb3;
      let coWeb3 = auxiliaryWeb3;
      let helper = new AnchorHelper(web3, coWeb3);
      let config = originConfig.anchor;
      let txOptions = Object.assign({}, originTxOptions);

      let anchorAddress = outAddresses.origin.anchor;
      let coAnchorAddress = outAddresses.auxiliary.anchor;

      txOptions.from = originConfig.anchorOrganization.owner;

      return helper.setCoAnchorAddress(coAnchorAddress, txOptions, anchorAddress).then(function() {
        //Nothing to update.
        let config = originConfig.anchor;
        config.coAnchorAddress = coAnchorAddress;
        return true;
      });
    });
  }

  setupLibs(
    promiseChain,
    originWeb3,
    auxiliaryWeb3,
    originConfig,
    auxiliaryConfig,
    originTxOptions,
    auxTxOptions,
    outAddresses
  ) {
    const oThis = this;

    //D.1 Deploy Libs [Aux]
    promiseChain = oThis.setupLibsOnAux(promiseChain, auxiliaryWeb3, auxiliaryConfig, auxTxOptions, outAddresses);

    //D.2 Deploy Libs [Orig]
    promiseChain = oThis.setupLibsOnOrigin(promiseChain, originWeb3, originConfig, originTxOptions, outAddresses);

    return promiseChain;
  }

  setupLibsOnAux(promiseChain, auxiliaryWeb3, auxiliaryConfig, auxTxOptions, outAddresses) {
    const oThis = this;
    return promiseChain
      .then(function() {
        let web3 = auxiliaryWeb3;
        let helper = new LibsHelper(web3);
        let config = auxiliaryConfig.libs;
        let txOptions = Object.assign({}, auxTxOptions);
        return helper.setup(config, txOptions).then(function() {
          return {
            merklePatriciaProof: helper.merklePatriciaProof,
            messageBus: helper.messageBus,
            gatewayLib: helper.gatewayLib
          };
        });
      })
      .then(function(libAddresses) {
        //Update Address Book
        let addresses = outAddresses.auxiliary;
        Object.assign(addresses, libAddresses);
      });
  }

  setupLibsOnOrigin(promiseChain, originWeb3, originConfig, originTxOptions, outAddresses) {
    const oThis = this;
    return promiseChain
      .then(function() {
        let web3 = originWeb3;
        let helper = new LibsHelper(web3);
        let config = originConfig.libs;
        let txOptions = Object.assign({}, originTxOptions);

        return helper.setup(config, txOptions).then(function() {
          return {
            merklePatriciaProof: helper.merklePatriciaProof,
            messageBus: helper.messageBus,
            gatewayLib: helper.gatewayLib
          };
        });
      })
      .then(function(libAddresses) {
        //Update Address Book
        let addresses = outAddresses.origin;
        Object.assign(addresses, libAddresses);
      });
  }

  setupGateways(
    promiseChain,
    originWeb3,
    auxiliaryWeb3,
    originConfig,
    auxiliaryConfig,
    originTxOptions,
    auxTxOptions,
    simpleTokenAddress,
    outAddresses
  ) {
    const oThis = this;

    return promiseChain
      .then(function() {
        let helper = new GatewayHelper();
        let gatewayTxOptions = Object.assign({}, originTxOptions);
        let cogatewayTxOptions = Object.assign({}, auxTxOptions);

        let gatewayConfig = (originConfig.gateway = Object.assign(
          {
            token: simpleTokenAddress,
            baseToken: simpleTokenAddress,
            organization: outAddresses.origin.tokenOrganization,
            organizationOwner: originConfig.tokenOrganization.owner,
            anchor: outAddresses.origin.anchor,
            messageBus: outAddresses.origin.messageBus,
            gatewayLib: outAddresses.origin.gatewayLib
          },
          originConfig.gateway
        ));

        let cogatewayConfig = (auxiliaryConfig.cogateway = Object.assign(
          {
            deployer: auxiliaryConfig.deployerAddress,
            valueToken: simpleTokenAddress,
            utilityToken: outAddresses.auxiliary.token,
            organization: outAddresses.auxiliary.tokenOrganization,
            organizationOwner: auxiliaryConfig.tokenOrganization.owner,
            anchor: outAddresses.auxiliary.anchor,
            messageBus: outAddresses.auxiliary.messageBus,
            gatewayLib: outAddresses.auxiliary.gatewayLib
          },
          auxiliaryConfig.cogateway
        ));

        console.log('gatewayConfig', JSON.stringify(gatewayConfig));
        console.log('cogatewayConfig', JSON.stringify(cogatewayConfig));

        return helper
          .setup(gatewayConfig, cogatewayConfig, gatewayTxOptions, cogatewayTxOptions, originWeb3, auxiliaryWeb3)
          .then(function() {
            return {
              gateway: helper.address,
              cogateway: helper.cogateway
            };
          });
      })
      .then(function(addresses) {
        outAddresses.origin.gateway = addresses.gateway;
        outAddresses.auxiliary.cogateway = addresses.cogateway;
      });
  }

  setGatewayAddresses(
    promiseChain,
    originWeb3 /* Needed for economy setup*/,
    auxiliaryWeb3,
    originConfig /* Needed for economy setup*/,
    auxiliaryConfig,
    originTxOptions /* Needed for economy setup*/,
    auxTxOptions,
    outAddresses
  ) {
    const oThis = this;

    return promiseChain.then(function() {
      let web3 = auxiliaryWeb3;
      let auxToken = outAddresses.auxiliary.token;
      let cogateway = outAddresses.auxiliary.cogateway;
      let txOptions = Object.assign({}, auxTxOptions);
      txOptions.from = auxiliaryConfig.tokenOrganization.owner;

      console.log('RRRR :: outAddresses', JSON.stringify(outAddresses));
      console.log('RRRR :: auxToken', auxToken);

      let helper = new OSTPrimeHelper(web3, auxToken);
      return helper.setCoGateway(cogateway, txOptions);
    });
  }

  finishSetup(promiseChain, originConfig, auxiliaryConfig, outAddresses) {
    const oThis = this;

    return promiseChain
      .then(function() {
        console.log('\x1b[32m' + 'Setup Completed successfully' + '\x1b[0m\n');

        console.log('\x1b[1m' + 'Origin Config:' + '\x1b[0m');
        console.log('\x1b[2m' + JSON.stringify(originConfig, null, 2) + '\x1b[0m');

        console.log('\x1b[1m' + 'Auxiliary Config:' + '\x1b[0m');
        console.log('\x1b[2m' + JSON.stringify(auxiliaryConfig, null, 2) + '\x1b[0m');

        console.log('\x1b[34m' + 'Addresses:' + '\x1b[0m');
        console.log('\x1b[33m' + JSON.stringify(outAddresses, null, 2) + '\x1b[0m');
        return {
          originConfig: originConfig,
          auxiliaryConfig: auxiliaryConfig,
          addresses: outAddresses
        };
      })
      .catch(function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        console.log('\x1b[31m' + 'Setup Failed!' + '\x1b[0m\n');

        console.log('\x1b[1m' + 'Origin Config:' + '\x1b[0m');
        console.log('\x1b[2m' + JSON.stringify(originConfig, null, 2) + '\x1b[0m');

        console.log('\x1b[1m' + 'Auxiliary Config:' + '\x1b[0m');
        console.log('\x1b[2m' + JSON.stringify(auxiliaryConfig, null, 2) + '\x1b[0m');

        console.log('\x1b[34m' + 'Addresses:' + '\x1b[0m');
        console.log('\x1b[33m' + JSON.stringify(outAddresses, null, 2) + '\x1b[0m');

        throw error;
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

  static get GatewayHelper() {
    return GatewayHelper;
  }

  static get CoGatewayHelper() {
    return CoGatewayHelper;
  }
}

module.exports = ChainSetup;
