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
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const Utils = require('../../src/utils/Utils');

describe('EIP20Token.approve()', () => {
  let web3;
  let tokenAddress;
  let token;

  let spenderAddress;
  let amount;
  let txOptions;
  let mockedTx;

  let spyApproveRawTx;
  let spyCall;
  let spySendTransaction;

  const setup = () => {
    spyApproveRawTx = sinon.replace(
      token,
      '_approveRawTx',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(token, 'approve');

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
    tokenAddress = '0x0000000000000000000000000000000000000002';
    token = new EIP20Token(web3, tokenAddress);

    spenderAddress = '0x0000000000000000000000000000000000000005';
    amount = '1000';
    mockedTx = 'MockedTx';

    txOptions = {
      from: '0x0000000000000000000000000000000000000003',
      to: '0x0000000000000000000000000000000000000004',
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw an error when transaction options is undefined', async () => {
    AssertAsync.throws(async () => {
      await token.approve(spenderAddress, amount, undefined);
    }, `Invalid transaction options: ${undefined}.`);
  });

  it('should throw an error when account address is undefined', async () => {
    delete txOptions.from;
    AssertAsync.throws(async () => {
      await token.approve(spenderAddress, amount, txOptions);
    }, `Invalid from address: ${undefined}.`);
  });

  it('should return mocked allowance value', async () => {
    setup();
    const result = await token.approve(spenderAddress, amount, txOptions);

    assert.strictEqual(result, true, 'Result must be true.');
    SpyAssert.assert(spyApproveRawTx, 1, [[spenderAddress, amount]]);
    SpyAssert.assert(spyCall, 1, [[spenderAddress, amount, txOptions]]);
    SpyAssert.assert(spySendTransaction, 1, [[mockedTx, txOptions]]);
    tearDown();
  });
});
