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
const StakeHelper = require('../../src/helpers/StakeHelper');
const Contracts = require('../../src/Contracts');
const SpyAssert = require('../../test_utils/SpyAssert');
const TestMosaic = require('../../test_utils/GetTestMosaic');

const assert = chai.assert;

describe('StakeHelper.getBounty()', () => {
  let stakeHelper;
  let mosaic;

  beforeEach(() => {
    // runs before each test in this block
    mosaic = TestMosaic.mosaic();
    stakeHelper = new StakeHelper(mosaic);
  });

  it('should return correct bounty value', async function() {
    const mockedBountyAmount = 100;

    // Mock an instance of gateway contract.
    const mockContract = sinon.mock(
      Contracts.getEIP20Gateway(
        mosaic.origin.web3,
        mosaic.origin.contractAddresses.EIP20Gateway,
      ),
    );
    const gatewayContract = mockContract.object;

    // Fake the bounty call.
    const spyBounty = sinon.replace(
      gatewayContract.methods,
      'bounty',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedBountyAmount);
      }),
    );

    const spyContract = sinon.replace(
      Contracts,
      'getEIP20Gateway',
      sinon.fake.returns(gatewayContract),
    );

    // Add spy on stakeHelper.getBounty.
    const spy = sinon.spy(stakeHelper, 'getBounty');

    // Call getBounty.
    const bounty = await stakeHelper.getBounty();

    // Assert the returned value.
    assert.strictEqual(
      bounty,
      mockedBountyAmount,
      'Bounty amount must be equal.',
    );

    SpyAssert.assert(spyBounty, 1, [[]]);
    SpyAssert.assert(spyContract, 1, [
      [mosaic.origin.web3, mosaic.origin.contractAddresses.EIP20Gateway],
    ]);
    SpyAssert.assert(spy, 1, [[]]);

    // Restore all mocked and spy objects.
    mockContract.restore();
    spy.restore();
    sinon.restore();
  });
});
