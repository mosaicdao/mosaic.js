'use strict';

const Web3 = require('web3');
const AbiBinProvider = require('../../libs/AbiBinProvider');
const ContractName = 'EIP20Gateway';
class GatewayHelper {
  constructor(web3, address, messageBusAddress, gatewayLibAddress) {
    const oThis = this;
    oThis.web3 = web3;
    oThis.address = address;
    oThis.messageBusAddress = messageBusAddress;
    oThis.gatewayLibAddress = gatewayLibAddress;
    oThis.abiBinProvider = new AbiBinProvider();
  }

  deploy(_token, _baseToken, _core, _bounty, _membersManager, messageBusAddress, gatewayLibAddress, txOptions, web3) {
    const oThis = this;

    web3 = web3 || oThis.web3;
    messageBusAddress = messageBusAddress || oThis.messageBusAddress;
    const messageBusLibInfo = {
      address: messageBusAddress,
      name: 'MessageBus'
    };
    const gatewayLibInfo = {
      address: gatewayLibAddress,
      name: 'GatewayLib'
    };

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getLinkedBIN(ContractName, messageBusLibInfo, gatewayLibInfo);

    let defaultOptions = {
      gas: '8000000'
    };
    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const contract = new web3.eth.Contract(abi, null, txOptions);
    let args = [_token, _baseToken, _core, _bounty, _membersManager];
    let tx = contract.deploy(
      {
        data: bin,
        arguments: args
      },
      txOptions
    );

    console.log('* Deploying EIP20Gateway Contract');
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
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .then(function(instace) {
        oThis.address = instace.options.address;
        console.log(`\t - ${ContractName} Contract Address:`, oThis.address);
        return txReceipt;
      });
  }

  activateGateway(_coGatewayAddress, txOptions, contractAddress, web3) {
    const oThis = this;
    web3 = web3 || oThis.web3;
    contractAddress = contractAddress || oThis.address;

    let defaultOptions = {
      gas: '2000000'
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const abiBinProvider = oThis.abiBinProvider;
    const abi = abiBinProvider.getABI(ContractName);
    const contract = new web3.eth.Contract(abi, contractAddress, txOptions);
    let tx = contract.methods.activateGateway(_coGatewayAddress);

    console.log(`* Activating ${ContractName} with CoGateWay Address: ${_coGatewayAddress}`);
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }
}

module.exports = GatewayHelper;
