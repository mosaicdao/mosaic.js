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
const Utils = require('../../src/utils/Utils');

const messageStatus = Utils.messageStatus();
const SpyAssert = require('../../test_utils/SpyAssert');
const Facilitator = require('../../src/Facilitator/Facilitator');

const assert = chai.assert;

describe('facilitator.progressStake()', () => {
  let facilitator;
  let originWeb3;
  let auxiliaryWeb3;
  let gatewayAddress;
  let coGatewayAddress;

  let mockedMessageHash;
  let txOptionOrigin;
  let txOptionAuxiliary;
  let stakeRequestParams;
  let secret;
  let mockedStakeStatus;
  let mockedMintStatus;

  let spyProgressStakeCall;
  let spyGetMessageHash;
  let spyGetStakeStatus;
  let spyGetMintStatus;
  let spyConfirmStakeIntent;
  let spyPerformProgress;

  const setup = () => {
    // Mock facilitator.getMessageHash
    spyGetMessageHash = sinon.replace(
      facilitator,
      'getMessageHash',
      sinon.fake.returns(mockedMessageHash),
    );

    // Mock facilitator.stakeHelper.getStakeStatus
    spyGetStakeStatus = sinon.replace(
      facilitator.stakeHelper,
      'getStakeStatus',
      sinon.fake.returns(mockedStakeStatus),
    );

    // Mock facilitator.stakeHelper.getMintStatus
    spyGetMintStatus = sinon.replace(
      facilitator.stakeHelper,
      'getMintStatus',
      sinon.fake.returns(mockedMintStatus),
    );

    // Mock facilitator.confirmStakeIntent
    spyConfirmStakeIntent = sinon.replace(
      facilitator,
      'confirmStakeIntent',
      sinon.fake.returns(true),
    );

    // Mock facilitator.performProgress
    spyPerformProgress = sinon.replace(
      facilitator,
      'performProgress',
      sinon.fake.returns(true),
    );

    spyProgressStakeCall = sinon.spy(facilitator, 'progressStake');
  };

  const tearDown = () => {
    spyProgressStakeCall.restore();
    sinon.restore();
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
    mockedStakeStatus = messageStatus.DECLARED;
    mockedMintStatus = messageStatus.DECLARED;
    mockedMessageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000111';
    stakeRequestParams = {
      staker: '0x0000000000000000000000000000000000000004',
      amount: '100000',
      beneficiary: '0x0000000000000000000000000000000000000005',
      gasPrice: '1',
      gasLimit: '100000000',
      nonce: '1',
      hashLock:
        '0x0000000000000000000000000000000000000000000000000000000000000222',
    };
    secret = '0x000000000111';
    txOptionOrigin = {
      from: '0x0000000000000000000000000000000000000020',
      to: gatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
    txOptionAuxiliary = {
      from: '0x0000000000000000000000000000000000000030',
      to: coGatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw error when origin transaction option is invalid', async () => {
    const expectedErrorMessage =
      'Invalid transaction options for origin chain.';
    await facilitator
      .progressStake(
        mockedMessageHash,
        undefined,
        txOptionAuxiliary,
        stakeRequestParams,
        secret,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when auxiliary transaction option is invalid', async () => {
    const expectedErrorMessage =
      'Invalid transaction options for auxiliary chain.';
    await facilitator
      .progressStake(
        mockedMessageHash,
        txOptionOrigin,
        undefined,
        stakeRequestParams,
        secret,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when stake message status is undeclared', async () => {
    setup();
    mockedStakeStatus = messageStatus.UNDECLARED;
    const expectedErrorMessage = 'Invalid message hash.';
    await facilitator
      .progressStake(
        mockedMessageHash,
        txOptionOrigin,
        txOptionAuxiliary,
        stakeRequestParams,
        secret,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
        tearDown();
      });
  });

  it('should throw error when stake request params is not provided', async () => {
    setup();
    const expectedErrorMessage = 'Invalid stake parameters.';
    await facilitator
      .progressStake(
        undefined,
        txOptionOrigin,
        txOptionAuxiliary,
        undefined,
        secret,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
        tearDown();
      });
  });

  // it('should not call `hashLockObj.unlockSecret` when secret is provided ', async () => {
  //   setup();
  //   const hashLockObj = {
  //     secret: 'secret',
  //     unlockSecret: '0x736563726574',
  //     hashLock:
  //       '0x65462b0520ef7d3df61b9992ed3bea0c56ead753be7c8b3614e0ce01e4cac41b',
  //   };
  //
  //
  //   const spyUnlockSecret = sinon.spy(hashLockObj.unlockSecret);
  //
  //   facilitator.hashLockObj = hashLockObj;
  //
  //   await facilitator.progressStake(
  //     messageStatus,
  //     txOptionOrigin,
  //     txOptionAuxiliary,
  //     stakeRequestParams,
  //     undefined,
  //   );
  //
  //   console.log('--------> spyUnlockSecret: ', spyUnlockSecret.called);
  //
  //   sinon.restore();
  //   tearDown();
  // });

  it('should call confirm stake intent and perform progress when mint message status if undeclared', async () => {
    mockedMintStatus = messageStatus.UNDECLARED;
    setup();
    await facilitator.progressStake(
      mockedMessageHash,
      txOptionOrigin,
      txOptionAuxiliary,
      stakeRequestParams,
      secret,
    );

    SpyAssert.assert(spyGetMessageHash, 0, [[stakeRequestParams]]);
    SpyAssert.assert(spyGetStakeStatus, 1, [[mockedMessageHash]]);
    SpyAssert.assert(spyGetMintStatus, 1, [[mockedMessageHash]]);
    SpyAssert.assert(spyConfirmStakeIntent, 1, [
      [mockedMessageHash, stakeRequestParams, txOptionAuxiliary],
    ]);
    SpyAssert.assert(spyPerformProgress, 1, [
      [mockedMessageHash, secret, txOptionOrigin, txOptionAuxiliary],
    ]);
    SpyAssert.assert(spyProgressStakeCall, 1, [
      [
        mockedMessageHash,
        txOptionOrigin,
        txOptionAuxiliary,
        stakeRequestParams,
        secret,
      ],
    ]);
  });
});
