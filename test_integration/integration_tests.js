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

const Mocha = require('mocha');
const Web3 = require('web3');
const { dockerSetup, dockerTeardown } = require('./docker');
const shared = require('./shared');

const runTests = async () => {
  const mocha = new Mocha({
    enableTimeouts: false,
  });

  console.warn(
    'If this is the first time running the tests on this machine, this step might take a while, as Docker downloads a required image for the tests.',
  );
  const { originRpcEndpoint, auxiliaryRpcEndpoint } = await dockerSetup();
  shared.origin.web3 = new Web3(originRpcEndpoint);
  shared.auxiliary.web3 = new Web3(auxiliaryRpcEndpoint);

  Mocha.utils
    .lookupFiles(__dirname, ['js'], true)
    .filter((file) => file.substr(-20) !== 'integration_tests.js')
    .forEach((file) => {
      mocha.addFile(file);
    });

  mocha.run(function(failures) {
    dockerTeardown();
    process.exitCode = failures ? 1 : 0;
  });
};

runTests();
