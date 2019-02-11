'use strict';

const file = require('../../config/file');
const AnchorConfig = require('../../config/AnchorConfig');

/**
 * Anchors a state root from a source blockchain onto a target blockchain.
 * @param {string} configFile Path to a mosaic configuration file.
 * @param {Object} anchorCmd The command that provides the options from CLI.
 * @param {string} target Which target to anchor onto.
 */
const anchor = (configFile, anchorCmd, target) => {
  try {
    const config = file.readConfig(configFile);
    const anchorConfig = new AnchorConfig(config, anchorCmd, target);

    // Actual anchor CLI code will go here. console.log as placeholder.
    console.log(anchorConfig);
  } catch (error) {
    console.log(error.toString());
    process.exit(1);
  }
};

module.exports = anchor;
