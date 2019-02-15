'use strict';

const anchors = require('./anchors');
const gateways = require('./gateways');
const organizations = require('./organizations');

/**
 * @file The Setup module provides an abstraction layer to simplify deployment and setup of mosaic
 * contracts.
 */

module.exports = {
  anchors,
  gateways,
  organizations,
};
