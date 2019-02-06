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

describe('EIP20CoGateway.redeem()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let redeemParams;
  let mockedTx;

  let spyMethod;
  let spyRedeemRawTx;
  let spySendTransaction;

  const setup = () => {
    spyRedeemRawTx = sinon.replace(
      coGateway,
      '_redeemRawTx',
      sinon.fake.resolves(mockedTx),
    );
    spySendTransaction = sinon.replace(
      Utils,
      'sendTransaction',
      sinon.fake.resolves(true),
    );

    spyMethod = sinon.spy(coGateway, 'redeem');
  };

  const tearDown = () => {
    sinon.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);

    redeemParams = {
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      nonce: '1',
      hashLock: '0xhashlock',
    };
    mockedTx = 'MockedTx';
  });

  it('should fail if transaction options are not passed', async () => {
    await AssertAsync.reject(
      coGateway.redeem(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      `Invalid transaction options: ${undefined}.`,
    );
  });

  it('should fail if from address is not defined in transaction  options', async () => {
    await AssertAsync.reject(
      coGateway.redeem(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
        {},
      ),
      `Invalid redeemer address: ${undefined}.`,
    );
  });

  it('should fail if from address is invalid in transaction  options', async () => {
    await AssertAsync.reject(
      coGateway.redeem(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
        { from: '0x123' },
      ),
      `Invalid redeemer address: ${'0x123'}.`,
    );
  });

  it('should pass with correct parameters', async () => {
    setup();

    let txOptions = {
      from: '0x0000000000000000000000000000000000000003',
    };

    let receipt = await coGateway.redeem(
      redeemParams.amount,
      redeemParams.beneficiary,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.nonce,
      redeemParams.hashLock,
      txOptions,
    );

    assert.strictEqual(receipt, true, 'Redeem should return true');

    SpyAssert.assert(spyMethod, 1, [
      [
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
        txOptions,
      ],
    ]);

    SpyAssert.assert(spyRedeemRawTx, 1, [
      [
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ],
    ]);

    SpyAssert.assert(spySendTransaction, 1, [[mockedTx, txOptions]]);

    tearDown();
  });
});
