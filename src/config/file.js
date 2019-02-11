'use strict';

const fs = require('fs');

/**
 * Reads a configuration from a file and returns the object.
 * @param {string} filePath The path to the config file to read.
 */
const readConfig = (filePath) => {
  const configFile = fs.readFileSync(filePath);
  const config = JSON.parse(configFile);

  return config;
};

module.exports = {
  readConfig,
};
