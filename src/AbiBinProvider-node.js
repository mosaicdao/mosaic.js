// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

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
