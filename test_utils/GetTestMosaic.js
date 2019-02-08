const chai = require('chai');
const Web3 = require('web3');
const Chain = require('../src/Chain');
const Mosaic = require('../src/Mosaic');

const { assert } = chai;

/**
 * This class returns Mosaic object used for unit testing.
 */
class GetTestMosaic {
  static mosaic() {
    const originContractAddresses = {
      EIP20Gateway: '0x0000000000000000000000000000000000001111',
    };
    const auxiliaryContractAddresses = {
      EIP20CoGateway: '0x0000000000000000000000000000000000002222',
    };
    const originWeb3Provider = 'http://localhost:8545';
    const originWeb3 = new Web3(originWeb3Provider);
    const originChain = new Chain(originWeb3, originContractAddresses);
    const auxiliaryWeb3Provider = 'http://localhost:8546';
    const auxiliaryWeb3 = new Web3(auxiliaryWeb3Provider);
    const auxiliaryChain = new Chain(
      auxiliaryWeb3,
      auxiliaryContractAddresses,
    );
    const mosaic = new Mosaic(originChain, auxiliaryChain);
    return mosaic;
  }
}

module.exports = GetTestMosaic;
