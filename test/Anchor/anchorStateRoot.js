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

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');

const assert = chai.assert;
const Anchor = require('../../src/ContractInteract/Anchor');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const Utils = require('../../src/utils/Utils');

describe('Anchor.anchorStateRoot', () => {
  let web3;
  let anchorAddress;
  let anchor;

  beforeEach(() => {
    web3 = new Web3();
    anchorAddress = '0x0000000000000000000000000000000000000002';
    anchor = new Anchor(web3, anchorAddress);
  });

  it('should pass when called with correct arguments', async () => {
    let blockHeight = '10';
    let stateRoot = web3.utils.sha3('1');
    let mockTx = 'mockTx';

    let txOptions = {
      from: '0x0000000000000000000000000000000000000003',
    };

    let spyMethod = sinon.replace(
      anchor.contract.methods,
      'anchorStateRoot',
      sinon.fake.returns(mockTx),
    );

    let spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
    let result = await anchor.anchorStateRoot(
      blockHeight,
      stateRoot,
      txOptions,
    );

    assert.isTrue(result, 'Anchor state root should return true');

    SpyAssert.assert(spyMethod, 1, [[blockHeight, stateRoot]]);

    SpyAssert.assert(spySendTransaction, 1, [[mockTx, txOptions]]);
  });

  it('should throw for undefined block height', async () => {
    let blockHeight = undefined;
    let stateRoot = web3.utils.sha3('1');

    let txOptions = {
      from: '0x0000000000000000000000000000000000000003',
    };

    await AssertAsync.reject(
      anchor.anchorStateRoot(blockHeight, stateRoot, txOptions),
      `Invalid block height: ${blockHeight}.`,
    );
  });

  it('should throw for undefined block height', async () => {
    let blockHeight = '10';
    let stateRoot = undefined;

    let txOptions = {
      from: '0x0000000000000000000000000000000000000003',
    };

    await AssertAsync.reject(
      anchor.anchorStateRoot(blockHeight, stateRoot, txOptions),
      `Invalid state root: ${stateRoot}.`,
    );
  });

  it('should throw for undefined txOptions', async () => {
    let blockHeight = '10';
    let stateRoot = web3.utils.sha3('1');

    let txOptions = undefined;

    await AssertAsync.reject(
      anchor.anchorStateRoot(blockHeight, stateRoot, txOptions),
      `Invalid transaction options: ${txOptions}.`,
    );
  });

  it('should throw for from address in txOptions is invalid', async () => {
    let blockHeight = '10';
    let stateRoot = web3.utils.sha3('1');

    let txOptions = {
      from: '0x123',
    };
    await AssertAsync.reject(
      anchor.anchorStateRoot(blockHeight, stateRoot, txOptions),
      `Invalid from address: ${txOptions.from}.`,
    );
  });

  it('should throw for from address in txOptions is undefined', async () => {
    let blockHeight = '10';
    let stateRoot = web3.utils.sha3('1');

    let txOptions = {
      from: undefined,
    };
    await AssertAsync.reject(
      anchor.anchorStateRoot(blockHeight, stateRoot, txOptions),
      `Invalid from address: ${txOptions.from}.`,
    );
  });
});
