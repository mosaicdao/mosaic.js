/**
 * @typedef {Object} OrganizationSetupConfig
 *
 * @property {string} deployer Address to be used to send deployment transactions.
 * @property {string} owner Address of the organization owner.
 * @property {string} admin Address of the organization admin.
 * @property {Array<string>} workers Addresses of the organization workers.
 * @property {string|number} workerExpirationHeight If any workers are given,
 *                           this will be the block height at which they expire.
 */

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

  /**
   * Setup for Organization contract. Deploys the contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {OrganizationSetupConfig} config Organization setup configuration.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Organization>} Promise containing the Organization instance that
   *                                  has been set up.
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

  /**
   * Validate the setup configuration.
   *
   * @param {OrganizationSetupConfig} config Organization setup configuration.
   *
   * @throws Will throw an error if setup configuration is incomplete.
   */
  static validateSetupConfig(config) {
    validateConfigKeyExists(config, 'deployer', 'config');
    validateConfigKeyExists(config, 'owner', 'config');
    validateConfigKeyExists(config, 'admin', 'config');
    validateConfigKeyExists(config, 'workers', 'config');
    validateConfigKeyExists(config, 'workerExpirationHeight', 'config');

    return true;
  }

  /**
   * Deploys an Organization contract.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} owner Address of the organization owner.
   * @param {string} admin Address of the organization admin.
   * @param {Array<string>} workers Addresses of the organization workers.
   * @param {string|number} workerExpirationHeight If any workers are given,
   *                        this will be the block height at which they expire.
   * @param {Object} txOptions Transaction options.
   *
   * @returns {Promise<Organization>} Promise containing the Organization instance that
   *                                  has been deployed.
   */
  static async deploy(
    web3,
    owner,
    admin,
    workers,
    workerExpirationHeight,
    txOptions,
  ) {
    const tx = Organization.deployRawTx(
      web3,
      owner,
      admin,
      workers,
      workerExpirationHeight,
    );

    return sendTransaction(tx, txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new Organization(web3, address);
    });
  }

  /**
   * Raw transaction for {@link Organization#deploy}.
   *
   * @param {Web3} web3 Web3 object.
   * @param {string} owner Address of the organization owner.
   * @param {string} admin Address of the organization admin.
   * @param {Array<string>} workers Addresses of the organization workers.
   * @param {string|number} workerExpirationHeight If any workers are given,
   *                        this will be the block height at which they expire.
   *
   * @returns {Object} Raw transaction.
   */
  static deployRawTx(web3, owner, admin, workers, workerExpirationHeight) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError(
        `Mandatory Parameter 'web3' is missing or invalid: ${web3}`,
      );
    }
    if (!Web3.utils.isAddress(owner)) {
      throw new TypeError(`Invalid owner address: ${owner}.`);
    }
    if (!Web3.utils.isAddress(admin)) {
      throw new TypeError(`Invalid admin address: ${admin}.`);
    }
    if (!Array.isArray(workers)) {
      throw new TypeError(`Invalid workers addresses: ${workers}.`);
    }
    if (
      !(
        typeof workerExpirationHeight === 'string' ||
        typeof workerExpirationHeight === 'number'
      )
    ) {
      throw new TypeError(
        `Invalid workerExpirationHeight: ${workerExpirationHeight}.`,
      );
    }

    const abiBinProvider = new AbiBinProvider();
    const contract = Contracts.getOrganization(web3, null, null);

    const bin = abiBinProvider.getBIN(ContractName);
    const args = [owner, admin, workers, workerExpirationHeight];

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }
}

module.exports = Organization;
