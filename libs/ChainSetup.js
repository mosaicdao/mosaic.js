const sampleOriginConfig = {
  deployer: {
    address: '0x...',
    gasPrice: '0x12A05F200'
  },
  organization: {
    address: null,
    owner: '0x...',
    admin: '0x...',
    worker: {
      address: '0x...',
      expirationHeight: '1234567890'
    }
  }
};

const Web3 = require('web3');
const AbiBinProvider = require('./AbiBinProvider');
const OrganizationHelper = require('./helpers/OrganizationHelper');

const defaultAuxiliaryConfig = {
  organisationOwner: null
};

class ChainSetup {
  constructor(originWeb3, originConfig, auxiliaryWeb3, auxiliaryConfig) {
    const oThis = this;
    if (typeof originWeb3 === 'string') {
      originWeb3 = new Web3(originWeb3);
    }

    if (typeof auxiliaryWeb3 === 'string') {
      auxiliaryWeb3 = new Web3(auxiliaryWeb3);
    }

    originConfig = originConfig || {};

    oThis.originConfig = Object.assign({}, originConfig);
    oThis.originWeb3 = originWeb3;
    oThis.auxiliaryWeb3 = auxiliaryWeb3;
    oThis.abiBinProvider = new AbiBinProvider();

    oThis.origin = {
      organization: new OrganizationHelper(originWeb3)
    };

    oThis.auxiliary = {
      organization: new OrganizationHelper(auxiliaryWeb3)
    };
  }

  static OrganizationHelper(web3, address) {
    if (typeof web3 === 'string') {
      web3 = new Web3(web3);
    }
    return new OrganizationHelper(web3, address);
  }
}

module.exports = ChainSetup;
