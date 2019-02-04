'use strict';

const fs = require('fs');
const path = require('path');

const loadContracts = (provider, abiFolderPath, binFolderPath) => {
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
    const contractAbi = JSON.parse(fs.readFileSync(abiFile));
    provider.addABI(contractName, contractAbi);
  });

  // add all bins from binFolderPath
  fs.readdirSync(binFolderPath).forEach((binFile) => {
    const contractName = path.basename(binFile, path.extname(binFile));
    const contractBin = fs.readFileSync(binFile, 'utf8');
    provider.addABI(contractName, contractBin);
  });
};

module.exports = {
  loadContracts,
};
