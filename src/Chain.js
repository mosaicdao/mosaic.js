'use strict';

const Web3 = require('web3');

/**
 * Chain stores a web3 instance to access a chain as well as the addresses of the required
 * contracts.
 * @param {Web3} web3 A web3 instance with a provider to access this chain.
 * @param {Object} contractAddresses Contract addresses, indexed by identifier, e.g. Anchor or
 *                                   Token.
 */
class Chain {
  /**
   * Creates a new Chain instance.
   * @param {Web3} web3 A web3 instance with a provider to access this chain.
   * @param {Object} contractAddresses Contract addresses, indexed by identifier, e.g. Anchor or
   *                                   Token.
   */
  constructor(web3, contractAddresses) {
    if (!(web3 instanceof Web3)) {
      throw new TypeError('web3 must be an instance of Web3.');
    }

    const chainPropertyConfiguration = {
      configurable: false,
      enumerable: true,
      writable: false,
    };

    Object.defineProperties(this, {
      web3: {
        value: web3,
        ...chainPropertyConfiguration,
      },
      contractAddresses: {
        value: contractAddresses,
        ...chainPropertyConfiguration,
      },
    });
  }
}

module.exports = Chain;
