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
const Facilitator = require('../../src/Facilitator');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('Facilitator.stake()', () => {
  let mosaic;
  let stakeParams;
  let txOptions;
  let facilitator;

  let isStakeAmountApproved;
  let isBountyAmountApproved;
  let approveStakeAmountResult;
  let approveBountyAmountResult;
  let nonce;
  let stakeResult;

  let spyIsStakeAmountApproved;
  let spyIsBountyAmountApproved;
  let spyApproveStakeAmount;
  let spyApproveBountyAmount;
  let spyGetNonce;
  let spyGatewayStake;
  let spyCall;

  const setup = () => {
    spyIsStakeAmountApproved = sinon.replace(
      facilitator.gateway,
      'isStakeAmountApproved',
      sinon.fake.resolves(isStakeAmountApproved),
    );
    spyIsBountyAmountApproved = sinon.replace(
      facilitator.gateway,
      'isBountyAmountApproved',
      sinon.fake.resolves(isBountyAmountApproved),
    );
    spyApproveStakeAmount = sinon.replace(
      facilitator.gateway,
      'approveStakeAmount',
      sinon.fake.resolves(approveStakeAmountResult),
    );
    spyApproveBountyAmount = sinon.replace(
      facilitator.gateway,
      'approveBountyAmount',
      sinon.fake.resolves(approveBountyAmountResult),
    );
    spyGetNonce = sinon.replace(
      facilitator.gateway,
      'getNonce',
      sinon.fake.resolves(nonce),
    );
    spyGatewayStake = sinon.replace(
      facilitator.gateway,
      'stake',
      sinon.fake.resolves(stakeResult),
    );
    spyCall = sinon.spy(facilitator, 'stake');
  };

  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    stakeParams = {
      staker: '0x0000000000000000000000000000000000000001',
      amount: '1000000',
      beneficiary: '0x0000000000000000000000000000000000000002',
      gasPrice: '1',
      gasLimit: '100000000',
      hashLock:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
    };
    txOptions = {
      from: stakeParams.staker,
      gas: '7500000',
    };
    facilitator = new Facilitator(mosaic);

    isStakeAmountApproved = true;
    isBountyAmountApproved = true;
    approveStakeAmountResult = true;
    approveBountyAmountResult = true;
    nonce = '1';
    stakeResult = true;
  });

  it('should throw an error when staker address is undefined', async () => {
    delete stakeParams.staker;
    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ),
      `Invalid staker address: ${stakeParams.staker}.`,
    );
  });

  it('should throw an error when stake amount is zero', async () => {
    stakeParams.amount = '0';
    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ),
      `Stake amount must not be zero: ${stakeParams.amount}.`,
    );
  });

  it('should throw an error when beneficiary address is undefined', async () => {
    delete stakeParams.beneficiary;
    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ),
      `Invalid beneficiary address: ${stakeParams.beneficiary}.`,
    );
  });

  it('should throw an error when gas price is undefined', async () => {
    delete stakeParams.gasPrice;
    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ),
      `Invalid gas price: ${stakeParams.gasPrice}.`,
    );
  });

  it('should throw an error when gas limit is undefined', async () => {
    delete stakeParams.gasLimit;
    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ),
      `Invalid gas limit: ${stakeParams.gasLimit}.`,
    );
  });

  it('should throw an error when hash lock is undefined', async () => {
    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        undefined,
        txOptions,
      ),
      `Invalid hash lock: ${undefined}.`,
    );
  });

  it('should throw an error when transaction option is undefined', async () => {
    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        undefined,
      ),
      `Invalid transaction options: ${undefined}.`,
    );
  });

  it('should throw an error when from address of transaction option is undefined', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ),
      `Invalid facilitator address: ${txOptions.from}.`,
    );
  });

  it('should throw an error when there is exeception while getting isStakeAmountApproved', async () => {
    const expectionMessage = 'Mocked exception';
    isStakeAmountApproved = Promise.reject(new Error(expectionMessage));
    setup();

    await AssertAsync.reject(
      facilitator.stake(
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ),
      expectionMessage,
    );
    teardown();
  });

  it('should call approve for stake amount', async () => {
    isStakeAmountApproved = Promise.resolve(false);
    setup();
    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Returned valued must match with the expected value',
    );

    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakeParams.staker, stakeParams.amount],
    ]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[txOptions.from]]);
    SpyAssert.assert(spyApproveStakeAmount, 1, [
      [stakeParams.amount, txOptions],
    ]);
    SpyAssert.assert(spyApproveBountyAmount, 0, [[]]);
    SpyAssert.assert(spyGetNonce, 1, [[stakeParams.staker]]);
    SpyAssert.assert(spyGatewayStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        '1',
        stakeParams.hashLock,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ],
    ]);
    teardown();
  });

  it('should call approve for bounty amount', async () => {
    isBountyAmountApproved = false;
    setup();
    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Returned valued must match with the expected value',
    );

    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakeParams.staker, stakeParams.amount],
    ]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[txOptions.from]]);
    SpyAssert.assert(spyApproveStakeAmount, 0, [[]]);
    SpyAssert.assert(spyApproveBountyAmount, 1, [[txOptions]]);
    SpyAssert.assert(spyGetNonce, 1, [[stakeParams.staker]]);
    SpyAssert.assert(spyGatewayStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        nonce,
        stakeParams.hashLock,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ],
    ]);
    teardown();
  });

  it('should pass with correct input params', async () => {
    setup();
    const result = await facilitator.stake(
      stakeParams.staker,
      stakeParams.amount,
      stakeParams.beneficiary,
      stakeParams.gasPrice,
      stakeParams.gasLimit,
      stakeParams.hashLock,
      txOptions,
    );

    assert.strictEqual(
      result,
      true,
      'Returned valued must match with the expected value',
    );

    SpyAssert.assert(spyIsStakeAmountApproved, 1, [
      [stakeParams.staker, stakeParams.amount],
    ]);
    SpyAssert.assert(spyIsBountyAmountApproved, 1, [[txOptions.from]]);
    SpyAssert.assert(spyApproveStakeAmount, 0, [[]]);
    SpyAssert.assert(spyApproveBountyAmount, 0, [[]]);
    SpyAssert.assert(spyGetNonce, 1, [[stakeParams.staker]]);
    SpyAssert.assert(spyGatewayStake, 1, [
      [
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        '1',
        stakeParams.hashLock,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        stakeParams.staker,
        stakeParams.amount,
        stakeParams.beneficiary,
        stakeParams.gasPrice,
        stakeParams.gasLimit,
        stakeParams.hashLock,
        txOptions,
      ],
    ]);
    teardown();
  });
});
