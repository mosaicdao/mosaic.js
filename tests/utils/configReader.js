'use strict';

const Web3 = require('web3');
const web3 = new Web3('http://localhost:8546');

module.exports = {
  // deployerAddress: devEnvConfig.deployerAddress,
  // chainOwner: devEnvConfig.chainOwnerAddress,
  // organizationOwner: devEnvConfig.organizationAddress,
  // organizationAdmin: devEnvConfig.wallet1, // TODO
  // // = facilitator
  // organizationWorker: devEnvConfig.facilitator,

  passphrase: 'testtest' // TODO: remove with Web3WalletHelper
  // gasPrice: '0x3B9ACA00',
  // gas: 8000000
};
