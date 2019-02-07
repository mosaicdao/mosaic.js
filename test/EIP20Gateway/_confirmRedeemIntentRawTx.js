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
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const assert = chai.assert;

describe('EIP20Gateway._confirmRedeemIntentRawTx()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let redeemParams;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      gateway.contract.methods,
      'confirmRedeemIntent',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(gateway, '_confirmRedeemIntentRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);

    redeemParams = {
      redeemer: '0x0000000000000000000000000000000000000005',
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

  it('should throw error when redeemer address is invalid', async () => {
    await AssertAsync.reject(
      gateway._confirmRedeemIntentRawTx(
        undefined,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.blockHeight,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ),
      `Invalid redeemer address: ${undefined}.`,
    );
  });

  it('should throw error when nonce is invalid', async () => {
    await AssertAsync.reject(
      gateway._confirmRedeemIntentRawTx(
        redeemParams.redeemer,
        undefined,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.blockHeight,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ),
      `Invalid nonce: ${undefined}.`,
    );
  });

  it('should throw error when beneficiary address is invalid', async () => {
    await AssertAsync.reject(
      gateway._confirmRedeemIntentRawTx(
        redeemParams.redeemer,
        redeemParams.nonce,
        undefined,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.blockHeight,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ),
      `Invalid beneficiary address: ${undefined}.`,
    );
  });

  it('should throw error when redeem amount is invalid', async () => {
    await AssertAsync.reject(
      gateway._confirmRedeemIntentRawTx(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        undefined,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.blockHeight,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ),
      `Invalid redeem amount: ${undefined}.`,
    );
  });

  it('should throw error when gas price is invalid', async () => {
    await AssertAsync.reject(
      gateway._confirmRedeemIntentRawTx(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        undefined,
        redeemParams.gasLimit,
        redeemParams.blockHeight,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ),
      `Invalid gas price: ${undefined}.`,
    );
  });

  it('should throw error when gas limit is invalid', async () => {
    await AssertAsync.reject(
      gateway._confirmRedeemIntentRawTx(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        undefined,
        redeemParams.blockHeight,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ),
      `Invalid gas limit: ${undefined}.`,
    );
  });

  it('should throw error when block height is invalid', async () => {
    await AssertAsync.reject(
      gateway._confirmRedeemIntentRawTx(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        undefined,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ),
      `Invalid block height: ${undefined}.`,
    );
  });

  it('should throw error when storage proof is invalid', async () => {
    await AssertAsync.reject(
      gateway._confirmRedeemIntentRawTx(
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.blockHeight,
        redeemParams.gasLimit,
        redeemParams.hashLock,
        undefined,
      ),
      `Invalid storage proof data: ${undefined}.`,
    );
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await gateway._confirmRedeemIntentRawTx(
      redeemParams.redeemer,
      redeemParams.nonce,
      redeemParams.beneficiary,
      redeemParams.amount,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.blockHeight,
      redeemParams.hashLock,
      redeemParams.storageProof,
    );
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [
      [
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.blockHeight,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ],
    ]);

    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.redeemer,
        redeemParams.nonce,
        redeemParams.beneficiary,
        redeemParams.amount,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.blockHeight,
        redeemParams.hashLock,
        redeemParams.storageProof,
      ],
    ]);
    tearDown();
  });
});
