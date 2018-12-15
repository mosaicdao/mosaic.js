'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const OrganizationHelper = require('./helpers/OrganizationHelper');
const SafeCoreHelper = require('./helpers/SafeCoreHelper');
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

    if (typeof simpleTokenAddress !== 'string') {
      throw new Error('Mandatory parameter "simpleTokenAddress" address missing.');
    }

    //Validate Auxiliary
    auxiliaryWeb3 = auxiliaryWeb3 || oThis.auxiliaryWeb3;
    if (typeof auxiliaryWeb3 !== 'object') {
      throw new Error('Mandatory parameter "auxiliaryWeb3" missing. ');
    }
    oThis.validateAuxiliaryConfig(auxiliaryConfig);

    //Validate Origin
    originWeb3 = originWeb3 || oThis.originWeb3;
    if (typeof originWeb3 !== 'object') {
      throw new Error('Mandatory parameter "originWeb3" missing.');
    }
    oThis.validateOriginConfig(originConfig);

    let outAddresses = {
      origin: {
        simpleToken: simpleTokenAddress
      },
      auxiliary: {}
    };

    //Start Deployments.
    let aAddresses = outAddresses.auxiliary;
    let auxiliaryTxOptions = {
      gasPrice: auxiliaryConfig.gasPrice
    };
    let aOPrimeHelper = new OSTPrimeHelper(auxiliaryWeb3);
    let aLibsHelper = new LibsHelper(auxiliaryWeb3);
    let aOrgHelper = new OrganizationHelper(auxiliaryWeb3);
    let aSCHelper = new SafeCoreHelper(auxiliaryWeb3);

    let ostPrimeAddress;
    console.log('\x1b[4m\n' + 'Deploying OSTPrime on auxiliary' + '\x1b[0m');
    let promiseChain = aOPrimeHelper.setup(simpleTokenAddress, auxiliaryConfig.ostPrime, auxiliaryTxOptions);

    promiseChain = promiseChain.then(function(_out) {
      //Add contract addresses to config as needed.
      let cogatewayConfig = auxiliaryConfig.cogateway;

      console.log('auxiliaryConfig', auxiliaryConfig);
      ostPrimeAddress = aOPrimeHelper.address;
      aAddresses.ostPrime = aOPrimeHelper.address;
      console.log('\x1b[32m' + 'OSTPrime deployed on auxiliary' + '\x1b[0m\n');
      return _out;
    });

    /*--------------------------- Mirrored Code Begins ---------------------------*/
    promiseChain = promiseChain
      .then(function() {
        console.log('\x1b[4m\n' + 'Deploying libs on auxiliary' + '\x1b[0m');
        return aLibsHelper.setup(auxiliaryConfig.libs, auxiliaryTxOptions);
      })
      .then(function(_out) {
        //Add contract addresses to config as needed.
        let cogatewayConfig = auxiliaryConfig.cogateway;

        cogatewayConfig.messageBus = aLibsHelper.messageBus;
        cogatewayConfig.gatewayLib = aLibsHelper.gatewayLib;
        cogatewayConfig.merklePatriciaProof = aLibsHelper.merklePatriciaProof;

        aAddresses.messageBus = aLibsHelper.messageBus;
        aAddresses.gatewayLib = aLibsHelper.gatewayLib;
        aAddresses.merklePatriciaProof = aLibsHelper.merklePatriciaProof;

        console.log('\x1b[32m' + 'Libs deployed on auxiliary' + '\x1b[0m\n');
        return _out;
      });

    promiseChain = promiseChain
      .then(function() {
        console.log('\x1b[4m\n' + 'Deploying organization on auxiliary' + '\x1b[0m');
        return aOrgHelper.setup(auxiliaryConfig.organization, auxiliaryTxOptions);
      })
      .then(function(_out) {
        //Add contract addresses to config as needed.
        let cogatewayConfig = auxiliaryConfig.cogateway;
        cogatewayConfig.organization = aOrgHelper.address;

        let orgConfig = auxiliaryConfig.organization;
        if (orgConfig.owner && orgConfig.completeOwnershipTransfer) {
          cogatewayConfig.organizationOwner = orgConfig.owner;
        } else {
          cogatewayConfig.organizationOwner = orgConfig.deployer;
        }

        let safeCoreConfig = auxiliaryConfig.safeCore;
        safeCoreConfig.organization = aOrgHelper.address;

        aAddresses.organization = aOrgHelper.address;
        console.log('\x1b[32m' + 'Organization deployed on auxiliary' + '\x1b[0m\n');
        return _out;
      });

    promiseChain = promiseChain
      .then(function() {
        console.log('\x1b[4m\n' + 'Deploying safeCore on auxiliary' + '\x1b[0m');
        return aSCHelper.setup(auxiliaryConfig.safeCore, auxiliaryTxOptions);
      })
      .then(function(_out) {
        //Add contract addresses to config as needed.
        let cogatewayConfig = auxiliaryConfig.cogateway;
        cogatewayConfig.safeCore = aSCHelper.address;
        auxiliaryConfig.safeCore.address = aSCHelper.address;

        aAddresses.safeCore = aSCHelper.address;
        console.log('\x1b[32m' + 'SafeCore deployed on auxiliary' + '\x1b[0m\n');
        return _out;
      });
    /*--------------------------- Mirrored Code Ends -----------------------------*/

    let oAddresses = outAddresses.origin;
    let originTxOptions = {
      gasPrice: originConfig.gasPrice
    };
    let oLibsHelper = new LibsHelper(originWeb3);
    let oOrgHelper = new OrganizationHelper(originWeb3);
    let oSCHelper = new SafeCoreHelper(originWeb3);
    let oGateway = new GatewayHelper(originWeb3);

    /*--------------------------- Mirrored Code Begins ---------------------------*/
    promiseChain = promiseChain
      .then(function() {
        console.log('\x1b[4m\n' + 'Deploying libs on origin' + '\x1b[0m');
        return oLibsHelper.setup(originConfig.libs, originTxOptions);
      })
      .then(function(_out) {
        //Add contract addresses to config as needed.
        let gatewayConfig = originConfig.gateway;

        gatewayConfig.messageBus = oLibsHelper.messageBus;
        gatewayConfig.gatewayLib = oLibsHelper.gatewayLib;
        gatewayConfig.merklePatriciaProof = oLibsHelper.merklePatriciaProof;

        oAddresses.messageBus = oLibsHelper.messageBus;
        oAddresses.gatewayLib = oLibsHelper.gatewayLib;
        oAddresses.merklePatriciaProof = oLibsHelper.merklePatriciaProof;
        console.log('\x1b[32m' + 'Libs deployed on origin' + '\x1b[0m\n');
        return _out;
      });

    promiseChain = promiseChain
      .then(function() {
        console.log('\x1b[4m\n' + 'Deploying organization on origin' + '\x1b[0m');
        return oOrgHelper.setup(originConfig.organization, originTxOptions);
      })
      .then(function(_out) {
        //Add contract addresses to config as needed.
        let gatewayConfig = originConfig.gateway;
        gatewayConfig.organization = oOrgHelper.address;

        let orgConfig = originConfig.organization;
        if (orgConfig.owner && orgConfig.completeOwnershipTransfer) {
          gatewayConfig.organizationOwner = orgConfig.owner;
        } else {
          gatewayConfig.organizationOwner = orgConfig.deployer;
        }

        let safeCoreConfig = originConfig.safeCore;
        safeCoreConfig.organization = oOrgHelper.address;

        oAddresses.organization = oOrgHelper.address;
        console.log('\x1b[32m' + 'Organization deployed on origin' + '\x1b[0m\n');
        return _out;
      });

    promiseChain = promiseChain
      .then(function() {
        console.log('\x1b[4m\n' + 'Deploying safeCore on origin' + '\x1b[0m');
        return oSCHelper.setup(originConfig.safeCore, originTxOptions);
      })
      .then(function(_out) {
        //Add contract addresses to config as needed.
        let gatewayConfig = originConfig.gateway;
        gatewayConfig.safeCore = oSCHelper.address;
        originConfig.safeCore.address = oSCHelper.address;

        oAddresses.safeCore = oSCHelper.address;
        console.log('\x1b[32m' + 'SafeCore deployed on origin' + '\x1b[0m\n');
        return _out;
      });
    /*--------------------------- Mirrored Code Ends ---------------------------*/

    /*--------------------------- *** Link Cores *** ---------------------------*/
    promiseChain = promiseChain.then(function() {
      console.log('\x1b[4m\n' + 'Setting coCore of safeCore on auxiliary' + '\x1b[0m');

      //Link on auxiliary
      let txParams = Object.assign({}, auxiliaryTxOptions);
      let config = auxiliaryConfig;
      let coConfig = originConfig;
      let coCore = coConfig.safeCore.address;

      //Determine the owner.
      if (config.organization.owner && config.organization.completeOwnershipTransfer) {
        txParams.from = config.organization.owner;
      } else {
        txParams.from = config.organization.deployer;
      }

      return aSCHelper.setCoCoreAddress(coCore, txParams).then(function(_out) {
        aAddresses.coCore = coCore;
        console.log('\x1b[32m' + 'coCore of safeCore on auxiliary set successfully' + '\x1b[0m\n');
        return _out;
      });
    });

    promiseChain = promiseChain.then(function() {
      console.log('\x1b[4m\n' + 'Setting coCore of safeCore on origin' + '\x1b[0m');

      //Link on origin
      let txParams = Object.assign({}, originTxOptions);
      let config = originConfig;
      let coConfig = auxiliaryConfig;
      let coCore = coConfig.safeCore.address;

      //Determine the owner.
      if (config.organization.owner && config.organization.completeOwnershipTransfer) {
        txParams.from = config.organization.owner;
      } else {
        txParams.from = config.organization.deployer;
      }

      oAddresses.coCore = coCore;
      return oSCHelper.setCoCoreAddress(coCore, txParams).then(function(_out) {
        oAddresses.coCore = coCore;
        console.log('\x1b[32m' + 'coCore of safeCore on origin set successfully' + '\x1b[0m\n');
        return _out;
      });
    });

    /*--------------------------- Temp Code ---------------------------*/
    promiseChain = promiseChain.then(function() {
      console.log('\x1b[32m' + 'Setup Completed successfully' + '\x1b[0m\n');

      console.log('\x1b[1m' + 'Origing Config:' + '\x1b[0m');
      console.log('\x1b[2m' + JSON.stringify(originConfig, null, 2) + '\x1b[0m');

      console.log('\x1b[1m' + 'Auxiliary Config:' + '\x1b[0m');
      console.log('\x1b[2m' + JSON.stringify(auxiliaryConfig, null, 2) + '\x1b[0m');

      console.log('\x1b[34m' + 'Addresses:' + '\x1b[0m');
      console.log('\x1b[33m' + JSON.stringify(outAddresses, null, 2) + '\x1b[0m');
    });

    /*--------------------------- Deploy Gateways ---------------------------*/
    promiseChain = promiseChain
      .then(function(_out) {
        return oGateway.setup(
          simpleTokenAddress,
          ostPrimeAddress,
          originConfig.gateway,
          auxiliaryConfig.cogateway,
          originTxOptions,
          auxiliaryTxOptions,
          originWeb3,
          auxiliaryWeb3
        );
      })
      .then(function(_out) {
        oAddresses.gateway = oGateway.address;
        aAddresses.cogateway = oGateway.cogateway;
        console.log('\x1b[32m' + 'coCore of safeCore on origin set successfully' + '\x1b[0m\n');
        return _out;
      });

    promiseChain = promiseChain.then(function() {
      console.log('\x1b[32m' + 'Setup Completed successfully' + '\x1b[0m\n');

      console.log('\x1b[1m' + 'Origing Config:' + '\x1b[0m');
      console.log('\x1b[2m' + JSON.stringify(originConfig, null, 2) + '\x1b[0m');

      console.log('\x1b[1m' + 'Auxiliary Config:' + '\x1b[0m');
      console.log('\x1b[2m' + JSON.stringify(auxiliaryConfig, null, 2) + '\x1b[0m');

      console.log('\x1b[34m' + 'Addresses:' + '\x1b[0m');
      console.log('\x1b[33m' + JSON.stringify(outAddresses, null, 2) + '\x1b[0m');
    });

    return promiseChain.then(function() {
      return {
        address: outAddresses,
        config: {
          origin: originConfig,
          auxiliary: auxiliaryConfig
        }
      };
    });
  }

  validateAuxiliaryConfig(config) {
    const oThis = this;

    console.log('\x1b[4m\n' + 'Validating auxiliaryConfig' + '\x1b[0m');
    oThis.validateConfig(config);
    oThis.validateOSTPrimeConfig(config);

    //Prepare cogatewayConfig
    config.cogateway = config.cogateway || {};
    oThis.validateCoGatewayConfig(config);

    config.gasPrice = config.gasPrice || '0x0';
    console.log('\x1b[32m' + 'auxiliaryConfig Validated' + '\x1b[0m\n');
    return true;
  }

  validateOriginConfig(config) {
    const oThis = this;

    console.log('\x1b[4m\n' + 'Validating originConfig' + '\x1b[0m');
    oThis.validateConfig(config);

    //Prepare gatewayConfig
    config.gateway = config.gateway || {};
    oThis.validateGatewayConfig(config);

    config.gasPrice = config.gasPrice || '0x5B9ACA00';
    console.log('\x1b[32m' + 'originConfig Validated' + '\x1b[0m\n');
    return true;
  }

  validateConfig(config) {
    const oThis = this;

    if (typeof config !== 'object') {
      throw new Error('Mandatory parameter "originConfig" missing. ');
    }
    if (typeof config.deployer !== 'string') {
      throw new Error('Mandatory parameter "deployer" missing. Set auxiliaryConfig.deployer address.');
    }
    oThis.validateLibsConfig(config);
    oThis.validateOrganizationConfig(config);
    oThis.validateSafeCoreConfig(config);

    return true;
  }

  validateLibsConfig(config) {
    const oThis = this;

    let gConfig = {
      deployer: config.deployer
    };

    if (config.libs) {
      Object.assign(gConfig, config.libs);
    }
    LibsHelper.validateSetupConfig(gConfig);
    config.libs = gConfig;
    return true;
  }

  validateOrganizationConfig(config) {
    const oThis = this;

    let gConfig = {
      deployer: config.deployer
    };

    if (config.organization) {
      Object.assign(gConfig, config.organization);
    }
    OrganizationHelper.validateSetupConfig(gConfig);
    config.organization = gConfig;
    return true;
  }

  validateCoGatewayConfig(config) {
    const oThis = this;
    let gConfig = {
      deployer: config.deployer,
      bounty: '0'
    };

    if (config.gateway) {
      Object.assign(gConfig, config.cogateway);
    }
    config.cogateway = gConfig;

    return true;
  }

  validateGatewayConfig(config) {
    const oThis = this;

    let gConfig = {
      deployer: config.deployer,
      bounty: '0'
    };

    if (config.gateway) {
      Object.assign(gConfig, config.gateway);
    }
    config.gateway = gConfig;

    return true;
  }

  //SafeCoreHelper.validateSetupConfig(config);

  validateSafeCoreConfig(config) {
    const oThis = this;

    let gConfig = {
      deployer: config.deployer
    };

    if (config.safeCore) {
      Object.assign(gConfig, config.safeCore);
    }
    SafeCoreHelper.validateSetupConfig(gConfig);
    config.safeCore = gConfig;
    return true;
  }

  validateOSTPrimeConfig(config) {
    let gConfig = {
      deployer: config.deployer
    };

    if (config.ostPrime) {
      Object.assign(gConfig, config.ostPrime);
    }

    OSTPrimeHelper.validateSetupConfig(gConfig);
    config.ostPrime = gConfig;
    return true;
  }

  static get OrganizationHelper() {
    return OrganizationHelper;
  }

  static get SafeCoreHelper() {
    return SafeCoreHelper;
  }

  static get OSTPrimeHelper() {
    return OSTPrimeHelper;
  }

  static get LibsHelper() {
    return LibsHelper;
  }
}

module.exports = ChainSetup;
