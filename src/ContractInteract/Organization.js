'use strict';

const Web3 = require('web3');

const AbiBinProvider = require('../AbiBinProvider');
const Contracts = require('../Contracts');
const { sendTransaction } = require('../utils/Utils');
const { validateConfigKeyExists } = require('./validation');

const ContractName = 'Organization';

class Organization {
  /**
   * Constructor for Organization.
   *
   * @param {Object} web3 Web3 object.
   * @param {string} address Organization contract address.
   */
  constructor(web3, address) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError("Mandatory Parameter 'web3' is missing or invalid");
    }
    if (!Web3.utils.isAddress(address)) {
      throw new TypeError(
        "Mandatory Parameter 'address' is missing or invalid.",
      );
    }

    this.web3 = web3;
    this.address = address;

    this.contract = Contracts.getEIP20Token(this.web3, this.address);

    if (!this.contract) {
      const err = new Error(
        `Could not load Organization contract for: ${this.address}`,
      );
      throw err;
    }
  }

  /*
  //Supported Configurations for setup
  config = {
    "deployer": config.deployerAddress,
    "owner": config.organizationOwner, 
    "admin": config.organizationAdmin, 
    "worker": config.organizationWorker,
    "workerExpirationHeight": 10000000
  };
  //deployer and worker are mandetory.
*/

  static setup(web3, config, txOptions = {}) {
    Organization.validateSetupConfig(config);

    const deployParams = txOptions;
    deployParams.from = config.deployer;

    return Organization.deploy(
      web3,
      config.owner,
      config.admin,
      config.workers,
      config.workerExpirationHeight,
      deployParams,
    );
  }

  static validateSetupConfig(config) {
    validateConfigKeyExists(config, 'deployer', 'config');
    validateConfigKeyExists(config, 'owner', 'config');
    validateConfigKeyExists(config, 'admin', 'config');
    validateConfigKeyExists(config, 'workers', 'config');
    validateConfigKeyExists(config, 'workerExpirationHeight', 'config');

    return true;
  }

  static async deploy(
    web3,
    owner,
    admin,
    workers,
    expirationHeight,
    txOptions,
  ) {
    const tx = Organization.deployRawTx(
      web3,
      owner,
      admin,
      workers,
      expirationHeight,
    );

    return sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new Organization(web3, address);
    });
  }

  static deployRawTx(web3, owner, admin, workers, expirationHeight) {
    const abiBinProvider = new AbiBinProvider();
    const contract = Contracts.getOrganization(web3, null, null);

    const bin = abiBinProvider.getBIN(ContractName);
    const args = [owner, admin, workers, expirationHeight];

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }
}

module.exports = Organization;
