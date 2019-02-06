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
