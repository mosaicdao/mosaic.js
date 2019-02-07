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

describe('EIP20CoGateway._redeemRawTx()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let redeemParams;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'redeem',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(coGateway, '_redeemRawTx');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
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

  it('should throw error when stake amount is zero', async () => {
    await AssertAsync.reject(
      coGateway._redeemRawTx(
        '0',
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      `Redeem amount must be greater than zero: ${0}.`,
    );
  });

  it('should throw error when beneficiary address is invalid', async () => {
    await AssertAsync.reject(
      coGateway._redeemRawTx(
        redeemParams.amount,
        '0x123',
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      `Invalid beneficiary address: ${'0x123'}.`,
    );
  });

  it('should throw error when gas price is undefined', async () => {
    await AssertAsync.reject(
      coGateway._redeemRawTx(
        redeemParams.amount,
        redeemParams.beneficiary,
        undefined,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      `Invalid gas price: ${undefined}.`,
    );
  });

  it('should throw error when gas limit is undefined', async () => {
    await AssertAsync.reject(
      coGateway._redeemRawTx(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        undefined,
        redeemParams.nonce,
        redeemParams.hashLock,
      ),
      `Invalid gas limit: ${undefined}.`,
    );
  });

  it('should throw error when nonce is undefined', async () => {
    await AssertAsync.reject(
      coGateway._redeemRawTx(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        undefined,
        redeemParams.hashLock,
      ),
      `Invalid nonce: ${undefined}.`,
    );
  });

  it('should throw error when hashlock is undefined', async () => {
    await AssertAsync.reject(
      coGateway._redeemRawTx(
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.gasPrice,
        undefined,
      ),
      `Invalid hash lock: ${undefined}.`,
    );
  });

  it('should return correct mocked transaction object', async () => {
    setup();
    const result = await coGateway._redeemRawTx(
      redeemParams.amount,
      redeemParams.beneficiary,
      redeemParams.gasPrice,
      redeemParams.gasLimit,
      redeemParams.nonce,
      redeemParams.hashLock,
    );
    assert.strictEqual(
      result,
      mockedTx,
      'Function should return mocked transaction object.',
    );

    SpyAssert.assert(spyMethod, 1, [
      [
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        redeemParams.amount,
        redeemParams.beneficiary,
        redeemParams.gasPrice,
        redeemParams.gasLimit,
        redeemParams.nonce,
        redeemParams.hashLock,
      ],
    ]);
    tearDown();
  });
});
