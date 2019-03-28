'use strict';

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
    .filter(file => file.substr(-20) !== 'integration_tests.js')
    .forEach((file) => {
      mocha.addFile(file);
    });

  mocha.run((failures) => {
    dockerTeardown();
    process.exitCode = failures ? 1 : 0;
  });
};

runTests();
