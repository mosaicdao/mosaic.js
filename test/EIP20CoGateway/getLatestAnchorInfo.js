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
const Anchor = require('../../src/ContractInteract/Anchor');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('EIP20CoGateway.getLatestAnchorInfo()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

  let mockAnchorContract;
  let getAnchorResult;
  let getLatestStateRootBlockHeightResult;
  let getStateRootResult;

  let spyGetAnchor;
  let spyGetLatestStateRootBlockHeight;
  let spyGetStateRootResult;
  let spyCall;

  const setup = () => {
    mockAnchorContract = sinon.mock(
      new Anchor(web3, '0x0000000000000000000000000000000000000020'),
    );
    getAnchorResult = mockAnchorContract.object;
    getLatestStateRootBlockHeightResult = '12345';
    getStateRootResult =
      '0x0000000000000000000000000000000000000000000000000000000000000001';

    spyGetAnchor = sinon.replace(
      coGateway,
      'getAnchor',
      sinon.fake.resolves(getAnchorResult),
    );
    spyGetLatestStateRootBlockHeight = sinon.replace(
      mockAnchorContract.object,
      'getLatestStateRootBlockHeight',
      sinon.fake.resolves(getLatestStateRootBlockHeightResult),
    );
    spyGetStateRootResult = sinon.replace(
      mockAnchorContract.object,
      'getStateRoot',
      sinon.fake.resolves(getStateRootResult),
    );
    spyCall = sinon.spy(coGateway, 'getLatestAnchorInfo');
  };

  const tearDown = () => {
    sinon.restore();
    spyCall.restore();
    mockAnchorContract.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);
  });

  it('should return anchor object', async () => {
    setup();
    const result = await coGateway.getLatestAnchorInfo();
    assert.strictEqual(
      result.blockHeight,
      getLatestStateRootBlockHeightResult,
      'Result.blockHeight of getLatestAnchorInfo must be equal to mocked block height',
    );
    assert.strictEqual(
      result.stateRoot,
      getStateRootResult,
      'Result.stateRoot of getLatestAnchorInfo must be equal to mocked state root height',
    );

    SpyAssert.assert(spyCall, 1, [[]]);
    SpyAssert.assert(spyGetAnchor, 1, [[]]);
    SpyAssert.assert(spyGetLatestStateRootBlockHeight, 1, [[]]);
    SpyAssert.assert(spyGetStateRootResult, 1, [
      [getLatestStateRootBlockHeightResult],
    ]);

    tearDown();
  });
});
