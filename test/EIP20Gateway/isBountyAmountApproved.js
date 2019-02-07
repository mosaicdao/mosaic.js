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
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');

const assert = chai.assert;

describe('EIP20Gateway.isBountyAmountApproved()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let facilitatorAddress;
  let baseTokenAddress;
  let mockedResult;
  let mockedBountyAmount;

  let mockedValueToken;
  let spyGetBounty;
  let spyGetEIP20BaseToken;
  let spyIsAmountApproved;
  let spyCall;

  const setup = () => {
    const token = new EIP20Token(web3, baseTokenAddress);
    mockedValueToken = sinon.mock(token);
    spyGetEIP20BaseToken = sinon.replace(
      gateway,
      'getEIP20BaseToken',
      sinon.fake.resolves(mockedValueToken.object),
    );
    spyIsAmountApproved = sinon.replace(
      mockedValueToken.object,
      'isAmountApproved',
      sinon.fake.returns(mockedResult),
    );
    spyGetBounty = sinon.replace(
      gateway,
      'getBounty',
      sinon.fake.resolves(mockedBountyAmount),
    );
    spyCall = sinon.spy(gateway, 'isBountyAmountApproved');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
    mockedValueToken.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);

    facilitatorAddress = '0x0000000000000000000000000000000000000005';
    baseTokenAddress = '0x0000000000000000000000000000000000000004';
    mockedResult = true;
    mockedBountyAmount = '1000';
  });

  it('should throw an error when facilitator address is undefined', async () => {
    await AssertAsync.reject(
      gateway.isBountyAmountApproved(undefined),
      `Invalid facilitator address: ${undefined}.`,
    );
  });

  it('should pass with correct params', async () => {
    setup();
    const result = await gateway.isBountyAmountApproved(facilitatorAddress);
    assert.strictEqual(
      result,
      true,
      'Result of isBountyAmountApproved must be true.',
    );

    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyGetEIP20BaseToken, 1, [[]]);
    SpyAssert.assert(spyIsAmountApproved, 1, [
      [facilitatorAddress, gatewayAddress, mockedBountyAmount],
    ]);
    SpyAssert.assert(spyCall, 1, [[facilitatorAddress]]);
    tearDown();
  });
});
