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
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const Message = require('../../src/utils/Message');

const MessageStatus = Message.messageStatus();
const assert = chai.assert;

describe('EIP20CoGateway.getOutboxMessageStatus()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let mockedMessageStatus;
  let messageHash;

  let spyMethod;
  let spyCall;

  const setup = () => {
    spyMethod = sinon.replace(
      coGateway.contract.methods,
      'getOutboxMessageStatus',
      sinon.fake.returns(() => {
        return Promise.resolve(mockedMessageStatus);
      }),
    );

    spyCall = sinon.spy(coGateway, 'getOutboxMessageStatus');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);
    mockedMessageStatus = MessageStatus.DECLARED;
    messageHash =
      '0x0000000000000000000000000000000000000000000000000000000000000222';
  });

  it('should throw an error when message hash is undefined', async () => {
    await AssertAsync.reject(
      coGateway.getOutboxMessageStatus(),
      `Invalid message hash: ${undefined}.`,
    );
  });

  it('should return correct mocked message status', async () => {
    setup();
    const result = await coGateway.getOutboxMessageStatus(messageHash);
    assert.strictEqual(
      result,
      mockedMessageStatus,
      'Function should return mocked message status.',
    );

    SpyAssert.assert(spyMethod, 1, [[messageHash]]);
    SpyAssert.assert(spyCall, 1, [[messageHash]]);
    tearDown();
  });
});
