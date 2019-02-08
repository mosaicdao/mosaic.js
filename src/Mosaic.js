'use strict';

const Chain = require('./Chain');

/**
 * Mosaic stores access to two chains of a mosaic set-up: origin and auxiliary.
 * @param {Chain} origin The origin chain of this mosaic set-up.
 * @param {Chain} auxiliary The auxiliary chain of this mosaic set-up.
 */
class Mosaic {
  /**
   * Creates a new Web3 instance.
   * @param {Chain} origin The origin chain of this mosaic set-up.
   * @param {Chain} auxiliary The auxiliary chain of this mosaic set-up.
   */
  constructor(origin, auxiliary) {
    if (!(origin instanceof Chain)) {
      throw new TypeError('origin must be an instance of Chain.');
    }

    if (!(auxiliary instanceof Chain)) {
      throw new TypeError('auxiliary must be an instance of Chain.');
    }

    const mosaicPropertyConfiguration = {
      configurable: false,
      enumerable: true,
      writable: false,
    };

    Object.defineProperties(this, {
      origin: {
        value: origin,
        ...mosaicPropertyConfiguration,
      },
      auxiliary: {
        value: auxiliary,
        ...mosaicPropertyConfiguration,
      },
    });
  }
}

module.exports = Mosaic;
