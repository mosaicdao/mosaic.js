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

describe('Facilitator.progressStakeMessage()', () => {
  let mosaic;
  let facilitator;
  let progressStakeMessageParams;

  let performProgressStakeResult;
  let performProgressMintResult;

  let spyPerformProgressStake;
  let spyPerformProgressMint;
  let spyCall;

  const setup = () => {
    spyPerformProgressStake = sinon.replace(
      facilitator,
      'performProgressStake',
      sinon.fake.resolves(performProgressStakeResult),
    );
    spyPerformProgressMint = sinon.replace(
      facilitator,
      'performProgressMint',
      sinon.fake.resolves(performProgressMintResult),
    );
    spyCall = sinon.spy(facilitator, 'progressStakeMessage');
  };
  const teardown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    facilitator = new Facilitator(mosaic);
    progressStakeMessageParams = {
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
    performProgressStakeResult = true;
    performProgressMintResult = true;
  });

  it('should throw an error when message hash is undefined', async () => {
    delete progressStakeMessageParams.messageHash;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid message hash: ${progressStakeMessageParams.messageHash}.`,
    );
  });

  it('should throw an error when unlock secret is undefined', async () => {
    delete progressStakeMessageParams.unlockSecret;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid unlock secret: ${progressStakeMessageParams.unlockSecret}.`,
    );
  });

  it('should throw an error when origin transaction option is undefined', async () => {
    delete progressStakeMessageParams.txOptionOrigin;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid origin transaction option: ${
        progressStakeMessageParams.txOptionOrigin
      }.`,
    );
  });

  it('should throw an error when auxiliary transaction option is undefined', async () => {
    delete progressStakeMessageParams.txOptionAuxiliary;
    await AssertAsync.reject(
      facilitator.progressStakeMessage(
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ),
      `Invalid auxiliary transaction option: ${
        progressStakeMessageParams.txOptionAuxiliary
      }.`,
    );
  });

  it('should pass with correct params', async () => {
    setup();
    const result = await facilitator.progressStakeMessage(
      progressStakeMessageParams.messageHash,
      progressStakeMessageParams.unlockSecret,
      progressStakeMessageParams.txOptionOrigin,
      progressStakeMessageParams.txOptionAuxiliary,
    );

    assert.deepEqual(
      result,
      [true, true],
      'Result of progressStakeMessage must be [true, true]',
    );

    SpyAssert.assert(spyPerformProgressStake, 1, [
      [
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
      ],
    ]);
    SpyAssert.assert(spyPerformProgressMint, 1, [
      [
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionAuxiliary,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [
      [
        progressStakeMessageParams.messageHash,
        progressStakeMessageParams.unlockSecret,
        progressStakeMessageParams.txOptionOrigin,
        progressStakeMessageParams.txOptionAuxiliary,
      ],
    ]);
    teardown();
  });
});
