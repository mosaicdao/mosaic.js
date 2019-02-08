'use strict';

/**
 * @file `shared` exists so that integration tests can share data among each other.
 *
 * One example is the addresses of contracts that were deployed on the test
 * environment.
 *
 * Due to node's caching behavior when loading modules, it always returns the
 * same object for repeated calls to `require()`.
 *
 * It is important that every `require` is written exactly `shared`,
 * case-sensitive!
 */

/**
 * @typedef {Object} Chain Contains all relevant data on a chain.
 * @property {Web3} web3 A web3 object to access the chain.
 * @property {Object} addresses All addresses in string format, indexed by the
 *     contract name, as written in the solidity source file.
 */

/**
 * @typedef {Object} SetupConfig
 * @property {string} chainOwner Address of the chain owner.
 * @property {string} deployerAddress Address of the deployer (Origin and Auxiliary).
 * @property {string} organizationOwner Address of the Organization owner (Origin and Auxiliary).
 * @property {string} organizationAdmin Address of the Organization admin (Origin and Auxiliary).
 * @property {string} organizationWorker Address of the single Organization worker (Origin and Auxiliary).
 *
 */

/**
 * @typedef {Object} Shared An object that is shared across modules.
 * @property {Chain} origin The origin chain.
 * @property {Chain} auxiliary The auxiliary chain.
 * @property {SetupConfig} setupConfig The setup configuration to use for `01_setup` tests.
 */

/**
 * @returns {Shared} The shared object.
 */
module.exports = {
  origin: {
    web3: {},
    addresses: {},
  },
  auxiliary: {
    web3: {},
    addresses: {},
  },
  setupConfig: {},
};
