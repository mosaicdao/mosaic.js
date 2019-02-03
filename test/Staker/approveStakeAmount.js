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

const assert = chai.assert;
const Staker = require('../../src/Staker/Staker');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('Staker.approveStakeAmount()', () => {
  let web3;
  let gatewayAddress;
  let staker;
  let stakeAmount;
  let txOptions;

  let mockedValueTokenAdress;
  let spyGetValueToken;
  let mockEIP20Token;
  let spyToken;
  let spyApprove;
  let spyCall;

  const setup = () => {
    spyGetValueToken = sinon.replace(
      staker.gatewayContract,
      'getValueToken',
      sinon.fake.resolves(mockedValueTokenAdress),
    );

    mockEIP20Token = sinon.mock(
      new EIP20Token(web3, '0x0000000000000000000000000000000000000004'),
    );
    const eip20TokenContract = mockEIP20Token.object;

    spyToken = sinon.replace(
      staker,
      'getValueToken',
      sinon.fake.resolves(eip20TokenContract),
    );

    spyApprove = sinon.replace(
      eip20TokenContract,
      'approve',
      sinon.fake.resolves(true),
    );

    spyCall = sinon.spy(staker, 'approveStakeAmount');
  };
  const tearDown = () => {
    sinon.restore();
    mockEIP20Token.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    staker = new Staker(web3, gatewayAddress);
    stakeAmount = '10000';
    txOptions = {
      from: '0x0000000000000000000000000000000000000004',
      to: gatewayAddress,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
    mockedValueTokenAdress = '0x0000000000000000000000000000000000000023';
  });

  it('should throw an error when stake amount undefined', async () => {
    assert.throws(() => {
      staker.approveStakeAmount(undefined, txOptions);
    }, /Invalid stake amount./);
  });

  it('should throw an error when transaction options is undefined', async () => {
    assert.throws(() => {
      staker.approveStakeAmount(stakeAmount, undefined);
    }, /Invalid transaction options./);
  });

  it('should throw an error when transaction options do not have staker address', async () => {
    delete txOptions.from;
    assert.throws(() => {
      staker.approveStakeAmount(stakeAmount, txOptions);
    }, /Invalid staker address./);
  });

  it('should pass when called with correct arguments', async () => {
    setup();
    const result = await staker.approveStakeAmount(stakeAmount, txOptions);
    assert.strictEqual(result, true, 'Result must be true');

    SpyAssert.assert(spyGetValueToken, 1, [[]]);
    SpyAssert.assert(spyToken, 1, [[mockedValueTokenAdress]]);
    SpyAssert.assert(spyApprove, 1, [
      [gatewayAddress, stakeAmount, txOptions],
    ]);
    SpyAssert.assert(spyCall, 1, [[stakeAmount, txOptions]]);

    tearDown();
  });
});
