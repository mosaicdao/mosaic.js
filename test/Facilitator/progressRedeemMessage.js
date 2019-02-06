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
const Facilitator = require('../../src/Facilitator/Facilitator');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('Facilitator.progressRedeemMessage()', () => {
  let mosaic;
  let facilitator;
  let progressRedeemMessageParams;

  let performProgressRedeemResult;
  let performProgressUnstakeResult;

  let spyPerformProgressRedeem;
  let spyPerformProgressUnstake;
  let spyCall;

  const setup = () => {
    spyPerformProgressRedeem = sinon.replace(
      facilitator,
      'performProgressRedeem',
      sinon.fake.resolves(performProgressRedeemResult),
    );
    spyPerformProgressUnstake = sinon.replace(
      facilitator,
      'performProgressUnstake',
      sinon.fake.resolves(performProgressUnstakeResult),
    );
    spyCall = sinon.spy(facilitator, 'progressRedeemMessage');
  };
  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    progressRedeemMessageParams = {
      messageHash:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
      unlockSecret:
        '0x0000000000000000000000000000000000000000000000000000000000000002',
      txOptionOrigin: {
        from: '0x0000000000000000000000000000000000000001',
        gas: '7500000',
      },
      txOptionAuxiliary: {
        from: '0x0000000000000000000000000000000000000002',
        gas: '7500000',
      },
    };
    performProgressRedeemResult = true;
    performProgressUnstakeResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    delete progressRedeemMessageParams.messageHash;
    await AssertAsync.reject(
      facilitator.progressRedeemMessage(
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
        progressRedeemMessageParams.txOptionAuxiliary,
      ),
      `Invalid message hash: ${progressRedeemMessageParams.messageHash}.`,
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    delete progressRedeemMessageParams.unlockSecret;
    await AssertAsync.reject(
      facilitator.progressRedeemMessage(
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
        progressRedeemMessageParams.txOptionAuxiliary,
      ),
      `Invalid unlock secret: ${progressRedeemMessageParams.unlockSecret}.`,
    );
  });

  it('should throw an error when origin transaction option is undefined', async () => {
    delete progressRedeemMessageParams.txOptionOrigin;
    await AssertAsync.reject(
      facilitator.progressRedeemMessage(
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
        progressRedeemMessageParams.txOptionAuxiliary,
      ),
      `Invalid origin transaction option: ${
        progressRedeemMessageParams.txOptionOrigin
      }.`,
    );
  });

  it('should throw an error when auxiliary transaction option is undefined', async () => {
    delete progressRedeemMessageParams.txOptionAuxiliary;
    await AssertAsync.reject(
      facilitator.progressRedeemMessage(
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
        progressRedeemMessageParams.txOptionAuxiliary,
      ),
      `Invalid auxiliary transaction option: ${
        progressRedeemMessageParams.txOptionAuxiliary
      }.`,
    );
  });

  it('should pass with correct params', async () => {
    setup();
    const result = await facilitator.progressRedeemMessage(
      progressRedeemMessageParams.messageHash,
      progressRedeemMessageParams.unlockSecret,
      progressRedeemMessageParams.txOptionOrigin,
      progressRedeemMessageParams.txOptionAuxiliary,
    );

    assert.deepEqual(
      result,
      [true, true],
      'Result of progressStakeMessage must be [true, true]',
    );

    SpyAssert.assert(spyPerformProgressRedeem, 1, [
      [
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
      ],
    ]);
    SpyAssert.assert(spyPerformProgressUnstake, 1, [
      [
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionAuxiliary,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressRedeemMessageParams.messageHash,
        progressRedeemMessageParams.unlockSecret,
        progressRedeemMessageParams.txOptionOrigin,
        progressRedeemMessageParams.txOptionAuxiliary,
      ],
    ]);
    teardown();
  });
});
