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
const sinon = require('sinon');
const Web3 = require('web3');
const StakeHelper = require('../../src/helpers/StakeHelper');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('StakeHelper.proveGateway()', () => {
  let stakeHelper;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;

  let blockHeight;
  let accountData;
  let accountProof;
  let txOption;

  let spyContract;
  let mockTx;
  let spyProveGatewayMethod;
  let spySendTransaction;
  let spyProveGateway;

  const setup = () => {
    // Mock an instance of cogateway contract.
    const mockContract = sinon.mock(
      Contracts.getEIP20CoGateway(web3, coGatewayAddress),
    );
    const coGatewayContract = mockContract.object;
    spyContract = sinon.replace(
      Contracts,
      'getEIP20CoGateway',
      sinon.fake.returns(coGatewayContract),
    );

    // Mock proveGateway transaction object.
    mockTx = sinon.mock(
      coGatewayContract.methods.proveGateway(
        blockHeight,
        accountData,
        accountProof,
      ),
    );

    spyProveGatewayMethod = sinon.replace(
      coGatewayContract.methods,
      'proveGateway',
      sinon.fake.returns(mockTx.object),
    );

    spySendTransaction = sinon.replace(
      StakeHelper,
      'sendTransaction',
      sinon.fake.returns(true),
    );

    // Add spy on stakeHelper.proveGateway.
    spyProveGateway = sinon.spy(stakeHelper, 'proveGateway');
  };

  const tearDown = () => {
    mockTx.restore();
    spyProveGateway.restore();
    sinon.restore();
  };

  beforeEach(() => {
    // runs before each test in this block
    web3 = new Web3('http://localhost:8545');
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    stakeHelper = new StakeHelper(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress,
    );

    blockHeight = '123';
    accountData = '0x23434334';
    accountProof = '0x34ffdff343';

    txOption = {
      from: '0x0000000000000000000000000000000000000004',
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw error when block height is invalid', async () => {
    const expectedErrorMessage = 'Invalid block height.';
    await stakeHelper
      .proveGateway(undefined, accountData, accountProof, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when account data is invalid', async () => {
    const expectedErrorMessage = 'Invalid account data.';
    await stakeHelper
      .proveGateway(blockHeight, undefined, accountProof, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when account proof is invalid', async () => {
    const expectedErrorMessage = 'Invalid account proof.';
    await stakeHelper
      .proveGateway(blockHeight, accountData, undefined, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when transaction option is invalid', async () => {
    const expectedErrorMessage = 'Invalid transaction options.';
    await stakeHelper
      .proveGateway(blockHeight, accountData, accountProof, undefined)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should pass with correct function arguments', async () => {
    setup();

    const result = await stakeHelper.proveGateway(
      blockHeight,
      accountData,
      accountProof,
      txOption,
    );

    // Assert the result/
    assert.strictEqual(result, true, 'Transaction result must be true.');

    // Assert the spy calls.
    SpyAssert.assert(spyContract, 1, [[web3, coGatewayAddress]]);
    SpyAssert.assert(spyProveGatewayMethod, 1, [
      [blockHeight, accountData, accountProof],
    ]);
    SpyAssert.assert(spyProveGateway, 1, [
      [blockHeight, accountData, accountProof, txOption],
    ]);
    SpyAssert.assert(spySendTransaction, 1, [[mockTx.object, txOption]]);

    tearDown();
  });
});
