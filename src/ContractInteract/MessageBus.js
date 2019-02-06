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

const Web3 = require('web3');

const AbiBinProvider = require('../AbiBinProvider');
const Utils = require('../utils/Utils');

const ContractName = 'MessageBus';

// TODO: docs mentioning library contract
class MessageBus {
  // TODO: docs
  constructor(web3, libraryAddress) {
    if (web3 instanceof Web3) {
      this.web3 = web3;
    } else {
      const err = new TypeError(
        "Mandatory Parameter 'web3' is missing or invalid",
      );
      throw err;
    }

    if (!Web3.utils.isAddress(libraryAddress)) {
      const err = new TypeError(
        "Mandatory Parameter 'libraryAddress' is missing or invalid.",
      );
      throw err;
    }

    this.address = libraryAddress;
  }

  // TODO: docs
  static async deploy(web3, merklePatriciaProof, txOptions) {
    const tx = MessageBus.deployRawTx(web3, merklePatriciaProof);

    const _txOptions = txOptions;
    if (!_txOptions.gas) {
      _txOptions.gas = await tx.estimateGas();
    }

    return Utils.sendTransaction(tx, _txOptions).then((txReceipt) => {
      const address = txReceipt.contractAddress;
      return new MessageBus(web3, address);
    });
  }

  // TODO: docs
  static deployRawTx(web3, merklePatriciaProof) {
    const merklePatriciaProofInfo = {
      name: 'MerklePatriciaProof',
      address: merklePatriciaProof,
    };
    const abiBinProvider = new AbiBinProvider();
    const abi = abiBinProvider.getABI(ContractName);
    const bin = abiBinProvider.getLinkedBIN(
      ContractName,
      merklePatriciaProofInfo,
    );

    const args = [];
    const contract = new web3.eth.Contract(abi, null, null);

    return contract.deploy({
      data: bin,
      arguments: args,
    });
  }
}

module.exports = MessageBus;
