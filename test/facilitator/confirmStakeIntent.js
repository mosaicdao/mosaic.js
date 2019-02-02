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

const SpyAssert = require('../../test_utils/SpyAssert');
const Facilitator = require('../../src/Facilitator/Facilitator');

const assert = chai.assert;

describe('facilitator.confirmStakeIntent()', () => {
  let facilitator;
  let originWeb3;
  let auxiliaryWeb3;
  let gatewayAddress;
  let coGatewayAddress;

  let txOption;
  let messageHash;
  let stakeRequestParams;

  let stakeMessageStatus;
  let canPerformConfirmStakeIntent;
  let commitedBlockHeight;
  let proofData;
  let isGatewayProved;
  let isStakeIntentConfirmed;

  let spyGetStakeStatus;
  let spyCanPerformConfrimStakeIntent;
  let spyGetLatestStateRootBlockHeight;
  let spyGetProof;
  let spyProveGateway;
  let spyStakeHelperConfirmStakeIntent;
  let spyConfirmStakeIntent;

  const setup = () => {
    // Mock facilitator.stakeHelper.getStakeStatus.
    spyGetStakeStatus = sinon.replace(
      facilitator.stakeHelper,
      'getStakeStatus',
      sinon.fake.returns(stakeMessageStatus),
    );

    // Mock facilitator.canPerformConfrimStakeIntent.
    spyCanPerformConfrimStakeIntent = sinon.replace(
      facilitator,
      'canPerformConfrimStakeIntent',
      sinon.fake.returns(canPerformConfirmStakeIntent),
    );

    // Mock facilitator.stakeHelper.getLatestStateRootBlockHeight.
    spyGetLatestStateRootBlockHeight = sinon.replace(
      facilitator.stakeHelper,
      'getLatestStateRootBlockHeight',
      sinon.fake.returns(commitedBlockHeight),
    );

    // Mock facilitator.getProof.
    spyGetProof = sinon.replace(
      facilitator,
      'getProof',
      sinon.fake.returns(proofData),
    );

    // Mock facilitator.stakeHelper.proveGateway.
    spyProveGateway = sinon.replace(
      facilitator.stakeHelper,
      'proveGateway',
      sinon.fake.returns(isGatewayProved),
    );

    // Mock facilitator.stakeHelper.confirmStakeIntent.
    spyStakeHelperConfirmStakeIntent = sinon.replace(
      facilitator.stakeHelper,
      'confirmStakeIntent',
      sinon.fake.returns(isStakeIntentConfirmed),
    );

    spyConfirmStakeIntent = sinon.spy(facilitator, 'confirmStakeIntent');
  };

  const tearDown = () => {
    sinon.restore();
    spyConfirmStakeIntent.restore();
  };

  beforeEach(() => {
    // runs before each test in this block
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    originWeb3 = new Web3();
    auxiliaryWeb3 = new Web3();
    facilitator = new Facilitator(
      originWeb3,
      auxiliaryWeb3,
      gatewayAddress,
      coGatewayAddress,
    );

    commitedBlockHeight = '1234';
    proofData = {
      accountData: '0xaccountdata',
      accountProof: '0xaccountproof',
      storageProof: '0xstorageproof',
      blockNumber: commitedBlockHeight,
    };
    txOption = {
      from: '0x0000000000000000000000000000000000000010',
      to: gatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
    stakeRequestParams = {
      staker: '0x0000000000000000000000000000000000000003',
      nonce: '2',
      beneficiary: '0x0000000000000000000000000000000000000004',
      amount: '1000',
      gasPrice: '1',
      gasLimit: '1000000',
      hashLock:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
    };
    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000001';

    canPerformConfirmStakeIntent = true;
    isGatewayProved = true;
    isStakeIntentConfirmed = true;
  });

  it('should throw error when message hash is invalid', async () => {
    const expectedErrorMessage = 'Invalid message hash.';
    await facilitator
      .confirmStakeIntent(undefined, stakeRequestParams, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when stake request param is invalid', async () => {
    const expectedErrorMessage = 'Invalid stake params.';
    await facilitator
      .confirmStakeIntent(messageHash, undefined, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when transaction option is invalid', async () => {
    const expectedErrorMessage = 'Invalid transaction option.';
    await facilitator
      .confirmStakeIntent(messageHash, stakeRequestParams, undefined)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when message status is invalid', async () => {
    canPerformConfirmStakeIntent = false;
    setup();
    const expectedErrorMessage =
      'Outbox message status must be declared, progressed or revocation declared.';
    await facilitator
      .confirmStakeIntent(messageHash, stakeRequestParams, txOption)
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
        tearDown();
      });
  });

  it('should pass when correct arguments are provided', async () => {
    setup();

    await facilitator.confirmStakeIntent(
      messageHash,
      stakeRequestParams,
      txOption,
    );

    // assert.strictEqual(result, true, 'Expected result must be true');

    SpyAssert.assert(spyGetStakeStatus, 1, [[messageHash]]);
    SpyAssert.assert(spyCanPerformConfrimStakeIntent, 1, [
      [stakeMessageStatus],
    ]);
    SpyAssert.assert(spyGetLatestStateRootBlockHeight, 1, [[]]);
    SpyAssert.assert(spyGetProof, 1, [
      [messageHash, commitedBlockHeight, stakeMessageStatus],
    ]);
    SpyAssert.assert(spyProveGateway, 1, [
      [proofData.blockNumber, proofData.accountData, proofData.accountProof],
    ]);
    SpyAssert.assert(spyStakeHelperConfirmStakeIntent, 1, [
      [
        stakeRequestParams.staker,
        stakeRequestParams.nonce,
        stakeRequestParams.beneficiary,
        stakeRequestParams.amount,
        stakeRequestParams.gasPrice,
        stakeRequestParams.gasLimit,
        stakeRequestParams.hashLock,
        proofData.blockNumber,
        proofData.storageProof,
        txOption,
      ],
    ]);
    SpyAssert.assert(spyConfirmStakeIntent, 1, [
      [messageHash, stakeRequestParams, txOption],
    ]);

    tearDown();
  });
});
