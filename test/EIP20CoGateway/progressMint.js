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
const Utils = require('../../src/utils/Utils');

describe('EIP20CoGateway.progressMint()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let txOptions;
  let messageHash;
  let unlockSecret;
  let mockedTx;

  let spyRawTx;
  let spyCall;
  let spySendTransaction;

  const setup = () => {
    spyRawTx = sinon.replace(
      coGateway,
      '_progressMintRawTx',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, 'progressMint');

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

    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000222';
    unlockSecret = '0xunlocksecret';
    mockedTx = 'MockedTx';
  });

  it('should throw error transaction object is invalid', async () => {
    await coGateway
      .progressMint(messageHash, unlockSecret, undefined)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          'Invalid transaction options.',
          'Exeception message should match',
        );
      });
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await coGateway.progressMint(
      messageHash,
      unlockSecret,
      txOptions,
    );
    assert.strictEqual(result, true, 'Result must be true.');

    SpyAssert.assert(spyRawTx, 1, [[messageHash, unlockSecret]]);
    SpyAssert.assert(spyCall, 1, [[messageHash, unlockSecret, txOptions]]);
    SpyAssert.assert(spySendTransaction, 1, [[mockedTx, txOptions]]);
    tearDown();
  });
});
