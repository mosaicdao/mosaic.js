'use strict';

const fs = require('fs');
const path = require('path');
const Logger = require('../logger/Logger');

const logger = new Logger('AbiBinProvider');

/**
 * @deprecated since version 0.10.0.
 *              See {@link https://github.com/openst/mosaic.js/issues/50}
 */
const loadContracts = (provider, abiFolderPath, binFolderPath) => {
  logger.warn(
    'Providing the `abiFolderPath` and `binFolderPath` parameter to the AbiBinProvider is deperecated and support for it will be removed in the future. See https://github.com/openst/mosaic.js/issues/50 for migration recommendations.',
  );

  if (!path.isAbsolute(abiFolderPath)) {
    const err = new Error(
      '"abiFolderPath" is not Absolute. Please provide absolute path.',
    );
    throw err;
  }
  if (!path.isAbsolute(binFolderPath)) {
    const err = new Error(
      '"binFolderPath" is not Absolute. Please provide absolute path.',
    );
    throw err;
  }

  // add all ABIs from abiFolderPath
  fs.readdirSync(abiFolderPath).forEach((abiFile) => {
    const contractName = path.basename(abiFile, path.extname(abiFile));
    const contractAbi = JSON.parse(
      fs.readFileSync(path.join(abiFolderPath, abiFile)),
    );
    provider.addABI(contractName, contractAbi);
  });

  // add all bins from binFolderPath
  fs.readdirSync(binFolderPath).forEach((binFile) => {
    const contractName = path.basename(binFile, path.extname(binFile));
    const contractBin = fs.readFileSync(
      path.join(binFolderPath, binFile),
      'utf8',
    );
    provider.addBIN(contractName, contractBin);
  });
};

module.exports = {
  loadContracts,
};
