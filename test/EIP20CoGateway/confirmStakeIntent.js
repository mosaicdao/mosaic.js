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
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const Utils = require('../../src/utils/Utils');

describe('EIP20CoGateway.confirmStakeIntent()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let txOptions;
  let stakeParams;
  let mockedTx;

  let spyRawTx;
  let spyCall;
  let spySendTransaction;

  const setup = () => {
    spyRawTx = sinon.replace(
      coGateway,
      '_confirmStakeIntentRawTx',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, 'confirmStakeIntent');

    spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    txOptions = {
      from: '0x0000000000000000000000000000000000000003',
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };

    stakeParams = {
      staker: '0x0000000000000000000000000000000000000005',
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: '0xhashlock',
      blockHeight: '12345',
      storageProof: '0x123',
    };
    mockedTx = 'MockedTx';
  });

  it('should throw error transaction object is invalid', async () => {
    AssertAsync.throws(async () => {
      await coGateway.confirmStakeIntent(
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
        undefined,
      );
    }, /Invalid transaction options./);
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await coGateway.confirmStakeIntent(
      stakeParams.staker,
      stakeParams.nonce,
      stakeParams.beneficiary,
      stakeParams.amount,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.hashLock,
      stakeParams.blockHeight,
      stakeParams.storageProof,
      txOptions,
    );
    assert.strictEqual(result, true, 'Result must be true.');

    SpyAssert.assert(spyRawTx, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
      ],
    ]);

    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.nonce,
        stakeParams.beneficiary,
        stakeParams.amount,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        stakeParams.blockHeight,
        stakeParams.storageProof,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spySendTransaction, 1, [[mockedTx, txOptions]]);
    tearDown();
  });
});
