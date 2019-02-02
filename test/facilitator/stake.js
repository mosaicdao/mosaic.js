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

const BN = require('bn.js');
const chai = require('chai');
const sinon = require('sinon');
const Web3 = require('web3');
const Facilitator = require('../../src/Facilitator/Facilitator');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('Facilitator.stake()', () => {
  let facilitator;
  let originWeb3;
  let auxiliaryWeb3;
  let gatewayAddress;
  let coGatewayAddress;
  let stakeParams = {};
  let txOption;

  let bountyAmount;
  let stakerNonce;
  let hashLockObj;
  let isStakeAmountApproved;
  let isBountyAmountApproved;

  let spyStakeCall;
  let spyGetGatewayNonce;
  let spyGetHashLock;
  let spyGetBounty;
  let spyApproveStakeAmount;
  let spyApproveBountyAmount;
  let spyStakeHelperStake;
  let spyIsStakeAmountApproved;
  let spyIsBountyAmountApproved;

  const setup = function() {
    // Mock facilitator.getHashLock method to return expected nonce from gateway.
    spyGetHashLock = sinon.replace(
      facilitator,
      'getHashLock',
      sinon.fake.returns(hashLockObj),
    );

    // Mock facilitator.stakeHelper.getNonce method to return expected nonce from gateway.
    spyGetGatewayNonce = sinon.replace(
      facilitator.stakeHelper,
      'getNonce',
      sinon.fake.returns(stakerNonce),
    );

    // Mock facilitator.stakeHelper.getBounty method to return expected bounty amount
    spyGetBounty = sinon.replace(
      facilitator.stakeHelper,
      'getBounty',
      sinon.fake.returns(bountyAmount),
    );

    // Mock facilitator.stakeHelper.isStakeAmountApproved method.
    spyIsStakeAmountApproved = sinon.replace(
      facilitator.stakeHelper,
      'isStakeAmountApproved',
      sinon.fake.returns(isStakeAmountApproved),
    );

    // Mock facilitator.stakeHelper.isBountyAmountApproved method.
    spyIsBountyAmountApproved = sinon.replace(
      facilitator.stakeHelper,
      'isBountyAmountApproved',
      sinon.fake.returns(isBountyAmountApproved),
    );

    // Mock facilitator.stakeHelper.approveStakeAmount method to return expected stake amount
    spyApproveStakeAmount = sinon.replace(
      facilitator.stakeHelper,
      'approveStakeAmount',
      sinon.fake.returns(true),
    );

    // Mock facilitator.stakeHelper.approveBountyAmount method to return expected bounty amount
    spyApproveBountyAmount = sinon.replace(
      facilitator.stakeHelper,
      'approveBountyAmount',
      sinon.fake.returns(true),
    );

    // Mock facilitator.stakeHelper.stake method to return
    spyStakeHelperStake = sinon.replace(
      facilitator.stakeHelper,
      'stake',
      sinon.fake.returns(true),
    );

    // Spy facilitator.stake call.
    spyStakeCall = sinon.spy(facilitator, 'stake');
  };

  const tearDown = function() {
    sinon.restore();
    spyStakeCall.restore();
  };

  beforeEach(() => {
    originWeb3 = new Web3();
    auxiliaryWeb3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000001';
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    facilitator = new Facilitator(
      originWeb3,
      auxiliaryWeb3,
      gatewayAddress,
      coGatewayAddress,
    );
    stakeParams = {
      staker: '0x0000000000000000000000000000000000000003',
      amount: '1000000000000',
      beneficiary: '0x0000000000000000000000000000000000000004',
      gasPrice: '1',
      gasLimit: '1000000',
      unlockSecret: 'secret',
    };

    hashLockObj = {
      secret: 'secret',
      unlockSecret: '0x736563726574',
      hashLock:
        '0x65462b0520ef7d3df61b9992ed3bea0c56ead753be7c8b3614e0ce01e4cac41b',
    };

    bountyAmount = '100';
    stakerNonce = '1';
    isStakeAmountApproved = true;
    isBountyAmountApproved = true;

    txOption = {
      from: '0x0000000000000000000000000000000000000010',
      to: gatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw error when staker address is invalid', async function() {
    const expectedErrorMessage = 'Invalid staker address.';
    await facilitator
      .stake(
        '0x123',
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when beneficiary address is invalid', async function() {
    const expectedErrorMessage = 'Invalid beneficiary address.';
    await facilitator
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        '0x123',
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when stake amount is zero', async function() {
    const expectedErrorMessage = 'Stake amount must not be zero.';
    await facilitator
      .stake(
        stakeParams.staker,
        '0',
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when gas price is undefined', async function() {
    const expectedErrorMessage = 'Invalid gas price.';
    await facilitator
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        undefined,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when gas limit is undefined', async function() {
    const expectedErrorMessage = 'Invalid gas limit.';
    await facilitator
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        undefined,
        stakeParams.unlockSecret,
        txOption,
      )
      .catch((exception) => {
        assert.strictEqual(
          exception.message,
          expectedErrorMessage,
          `Exception reason must be "${expectedErrorMessage}"`,
        );
      });
  });

  it('should throw error when staker has not approved token transfer', async function() {
    isStakeAmountApproved = false;
    setup();
    const expectedErrorMessage = 'Transfer of stake amount must be approved.';
    await facilitator
      .stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
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

  it('should pass when without unlock secret', async function() {
    delete stakeParams.unlockSecret;
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      txOption,
    );

    assert.strictEqual(result, true, 'Expected result must be true');

    SpyAssert.assert(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      ],
    ]);

    SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    SpyAssert.assert(spyGetHashLock, 1, [[undefined]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyApproveStakeAmount, 0, [[]]);
    SpyAssert.assert(spyApproveBountyAmount, 0, [[]]);
    SpyAssert.assert(spyStakeHelperStake, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock,
        txOption,
      ],
    ]);
    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakeParams.staker, stakeParams.amount],
    ]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[txOption.from]]);
    tearDown();
  });

  it('should pass when called with unlock secret', async function() {
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      txOption,
    );

    assert.strictEqual(result, true, 'Expected result must be true');

    SpyAssert.assert(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      ],
    ]);

    SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyApproveStakeAmount, 0, [[]]);
    SpyAssert.assert(spyApproveBountyAmount, 0, [[]]);
    SpyAssert.assert(spyStakeHelperStake, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock,
        txOption,
      ],
    ]);
    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakeParams.staker, stakeParams.amount],
    ]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[txOption.from]]);
    tearDown();
  });

  it('should pass when staker is facilitator and stake amount transfer is not approved', async function() {
    isStakeAmountApproved = false;
    txOption.from = stakeParams.staker;
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      txOption,
    );

    assert.strictEqual(result, true, 'Expected result must be true');

    SpyAssert.assert(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      ],
    ]);

    SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyApproveStakeAmount, 1, [
      [stakeParams.staker, stakeParams.amount, txOption],
    ]);
    SpyAssert.assert(spyApproveBountyAmount, 0, [[]]);
    SpyAssert.assert(spyStakeHelperStake, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock,
        txOption,
      ],
    ]);
    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakeParams.staker, stakeParams.amount],
    ]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[txOption.from]]);
    tearDown();
  });

  it('should pass when facilitator has not approved the bounty transfer', async function() {
    isBountyAmountApproved = false;
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      txOption,
    );

    assert.strictEqual(result, true, 'Expected result must be true');

    SpyAssert.assert(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      ],
    ]);

    SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);

    SpyAssert.assert(spyApproveStakeAmount, 0, [[]]);
    SpyAssert.assert(spyApproveBountyAmount, 1, [[txOption]]);
    SpyAssert.assert(spyStakeHelperStake, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock,
        txOption,
      ],
    ]);
    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakeParams.staker, stakeParams.amount],
    ]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[txOption.from]]);
    tearDown();
  });

  it('should pass when bounty amout is zero', async function() {
    bountyAmount = '0';
    setup();

    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.unlockSecret,
      txOption,
    );

    assert.strictEqual(result, true, 'Expected result must be true');

    SpyAssert.assert(spyStakeCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.unlockSecret,
        txOption,
      ],
    ]);

    SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
    SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
    SpyAssert.assert(spyGetBounty, 1, [[]]);

    SpyAssert.assert(spyApproveStakeAmount, 0, [[]]);
    SpyAssert.assert(spyApproveBountyAmount, 0, [[]]);
    SpyAssert.assert(spyStakeHelperStake, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakerNonce,
        hashLockObj.hashLock,
        txOption,
      ],
    ]);
    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakeParams.staker, stakeParams.amount],
    ]);
    SpyAssert.assert(spyIsBountyAmountApproved, 0, [[]]);
    tearDown();
  });
});
