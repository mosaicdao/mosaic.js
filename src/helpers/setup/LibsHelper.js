'use strict';

const MerklePatriciaProof = require('../../ContractInteract/MerklePatriciaProof');
const MessageBus = require('../../ContractInteract/MessageBus');
const GatewayLib = require('../../ContractInteract/GatewayLib');
const {
  sendTransaction,
  deprecationNoticeChainSetup,
} = require('../../utils/Utils');

class LibsHelper {
  constructor(web3, merklePatriciaProof, messageBus, gatewayLib) {
    this.web3 = web3;
    this.merklePatriciaProof = merklePatriciaProof;
    this.messageBus = messageBus;
    this.gatewayLib = gatewayLib;

    this.deployMerklePatriciaProof = this.deployMerklePatriciaProof.bind(this);
    this.deployMessageBus = this.deployMessageBus.bind(this);
    this.deployGatewayLib = this.deployGatewayLib.bind(this);
  }

  deployMerklePatriciaProof(txOptions, web3 = this.web3) {
    deprecationNoticeChainSetup('LibsHelper.deployMerklePatriciaProof');

    const tx = MerklePatriciaProof.deployRawTx(web3);

    const defaultOptions = {
      gas: '3000000',
    };
    const _txOptions = Object.assign({}, defaultOptions, txOptions);

    return sendTransaction(tx, _txOptions).then((txReceipt) => {
      this.merklePatriciaProof = txReceipt.contractAddress;
      return txReceipt;
    });
  }

  deployMessageBus(
    merklePatriciaProof = this.merklePatriciaProof,
    txOptions,
    web3 = this.web3,
  ) {
    deprecationNoticeChainSetup('LibsHelper.deployMessageBus');

    const tx = MessageBus.deployRawTx(web3, merklePatriciaProof);

    const defaultOptions = {
      gas: '5000000',
    };
    const _txOptions = Object.assign({}, defaultOptions, txOptions);

    return sendTransaction(tx, _txOptions).then((txReceipt) => {
      this.messageBus = txReceipt.contractAddress;
      return txReceipt;
    });
  }

  deployGatewayLib(
    merklePatriciaProof = this.merklePatriciaProof,
    txOptions,
    web3 = this.web3,
  ) {
    deprecationNoticeChainSetup('LibsHelper.deployGatewayLib');

    const tx = GatewayLib.deployRawTx(web3, merklePatriciaProof);

    const defaultOptions = {
      gas: '2000000',
    };
    const _txOptions = Object.assign({}, defaultOptions, txOptions);

    return sendTransaction(tx, _txOptions).then((txReceipt) => {
      this.gatewayLib = txReceipt.contractAddress;
      return txReceipt;
    });
  }
}

module.exports = LibsHelper;
