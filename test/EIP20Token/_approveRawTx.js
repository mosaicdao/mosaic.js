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

describe('EIP20Token._approveRawTx()', () => {
  let web3;
  let tokenAddress;
  let token;

  let spenderAddress;
  let amount;
  let mockedTx;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      token.contract.methods,
      'approve',
      sinon.fake.resolves(mockedTx),
    );

    spyCall = sinon.spy(token, '_approveRawTx');
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
  });

  it('should throw an error when spender address is undefined', async () => {
    token._approveRawTx(undefined, amount).catch((exception) => {
      assert.strictEqual(
        exception.message,
        'Invalid spender address.',
        'Execption message must match',
      );
    });
  });

  it('should throw an error when amount is undefined', async () => {
    token._approveRawTx(spenderAddress, undefined).catch((exception) => {
      assert.strictEqual(
        exception.message,
        'Invalid approval amount.',
        'Execption message must match',
      );
    });
  });

  it('should return mocked transaction object', async () => {
    setup();
    const result = await token._approveRawTx(spenderAddress, amount);

    assert.strictEqual(
      result,
      mockedTx,
      'Mocked transaction object must be returned.',
    );
    SpyAssert.assert(spyMethod, 1, [[spenderAddress, amount]]);
    SpyAssert.assert(spyCall, 1, [[spenderAddress, amount]]);
    tearDown();
  });
});
