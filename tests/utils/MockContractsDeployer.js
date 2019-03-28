'use strict';

const fs = require('fs');
const path = require('path');

const Package = require('../../index');
const AbiBinProvider = Package.AbiBinProvider;

const mockAbiFolder = path.resolve(__dirname, './mock-contracts/abi');
const mockBinFolder = path.resolve(__dirname, './mock-contracts/bin');

class MockContractsDeployer {
  constructor(deployer, web3) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.deployer = deployer;
    oThis.abiBinProvider = MockContractsDeployer.abiBinProvider();
    oThis.addresses = {};
  }

  deployMockToken(web3, txOptions) {
    const oThis = this;
    return oThis.deploy('MockToken', web3, txOptions);
  }
  deploy(contractName, web3, txOptions) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(contractName);
    const bin = abiBinProvider.getBIN(contractName);

    let defaultOptions = {
      from: oThis.deployer,
      gas: '7500000',
      gasPrice: '0x5B9ACA00',
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    let args = [];
    const contract = new web3.eth.Contract(abi, null, txOptions);
    let tx = contract.deploy(
      {
        data: bin,
        arguments: args,
      },
      txOptions,
    );

    console.log(`* Deploying ${contractName} Contract`);
    let txReceipt;
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      })
      .on('receipt', function(receipt) {
        txReceipt = receipt;
        console.log(
          '\t - Receipt:\n\x1b[2m',
          JSON.stringify(receipt),
          '\x1b[0m\n',
        );
      })
      .then(function(instace) {
        oThis.addresses[contractName] = instace.options.address;
        console.log(`\t - ${contractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  static abiBinProvider() {
    const provider = new AbiBinProvider();

    const MockTokenAbi = JSON.parse(
      fs.readFileSync(path.join(mockAbiFolder, 'MockToken.abi')),
    );
    const MockTokenBin = fs.readFileSync(
      path.join(mockBinFolder, 'MockToken.bin'),
      'utf8',
    );
    provider.addABI('MockToken', MockTokenAbi);
    provider.addBIN('MockToken', MockTokenBin);

    return provider;
  }
}

module.exports = MockContractsDeployer;
