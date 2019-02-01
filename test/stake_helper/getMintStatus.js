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

describe('StakeHelper.getBounty()', () => {
  let stakeHelper;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;

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
  });

  it('should return correct mint status', async function() {
    const mockedMessageStatus = '1';
    const messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000001';

    // Mock an instance of cogateway contract.
    const mockContract = sinon.mock(
      Contracts.getEIP20CoGateway(web3, coGatewayAddress),
    );
    const coGatewayContract = mockContract.object;

    // Fake the getInboxMessageStatus call.
    const spyGetInboxMessageStatus = sinon.replace(
      coGatewayContract.methods,
      'getInboxMessageStatus',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedMessageStatus);
      }),
    );

    const spyContract = sinon.replace(
      Contracts,
      'getEIP20CoGateway',
      sinon.fake.returns(coGatewayContract),
    );

    // Add spy on stakeHelper.getMintStatus.
    const spy = sinon.spy(stakeHelper, 'getMintStatus');

    // Call getMintStatus.
    const status = await stakeHelper.getMintStatus(messageHash);

    // Assert the returned value.
    assert.strictEqual(
      status,
      mockedMessageStatus,
      'Message status from contract amount must be equal to expected value.',
    );

    SpyAssert.assert(spyGetInboxMessageStatus, 1, [[messageHash]]);
    SpyAssert.assert(spyContract, 1, [[web3, coGatewayAddress]]);
    SpyAssert.assert(spy, 1, [[messageHash]]);

    // Restore all mocked and spy objects.
    mockContract.restore();
    spy.restore();
    sinon.restore();
  });
});
