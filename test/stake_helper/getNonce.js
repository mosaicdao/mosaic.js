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
const SpyAssert = require('../../test_utils/SpyAssert');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');

const assert = chai.assert;

describe('StakeHelper.getNonce()', () => {
  let stakeHelper;
  let mosaic;

  beforeEach(() => {
    // runs before each test in this block
    mosaic = TestMosaic.mosaic();
    stakeHelper = new StakeHelper(mosaic);
  });

  it('should throw error when account address is not string', async function() {
    this.timeout(5000);

    const accountAddress = 0x0000000000000000000000000000000000000003;
    await AssertAsync.reject(
      stakeHelper.getNonce(accountAddress),
      `Invalid account address: ${accountAddress}.`,
    );
  });

  it('should return correct nonce value', async function() {
    const accountAddress = '0x79376dc1925ba1e0276473244802287394216a39';

    // Add spy on stakeHelper.getGatewayNonce.
    const spy = sinon.spy(stakeHelper, 'getNonce');

    const spyNonce = sinon.replace(
      stakeHelper,
      '_getNonce',
      sinon.fake.resolves(1),
    );

    // Call getNonce.
    const nonce = await stakeHelper.getNonce(accountAddress);

    // Assert the returned value.
    assert.strictEqual(nonce, 1, 'Nonce must be equal.');

    SpyAssert.assert(spyNonce, 1, [
      [
        accountAddress,
        mosaic.origin.web3,
        mosaic.origin.contractAddresses.EIP20Gateway,
      ],
    ]);
    SpyAssert.assert(spy, 1, [[accountAddress]]);

    // Restore all mocked and spy objects.
    spy.restore();
    sinon.restore();
  });
});
