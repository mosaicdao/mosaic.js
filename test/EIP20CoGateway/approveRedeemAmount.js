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
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const assert = chai.assert;

describe('EIP20CoGateway.approveRedeemAmount()', () => {
  let mosaic;
  let redeemAmount;
  let txOptions;
  let coGateway;

  let spyGetEIP20UtilityToken;
  let mockEIP20UtilityToken;
  let spyApprove;
  let spyCall;

  const setup = () => {
    mockEIP20UtilityToken = sinon.mock(
      new EIP20Token(
        mosaic.origin.web3,
        '0x0000000000000000000000000000000000000004',
      ),
    );
    const eip20UtilityTokenContract = mockEIP20UtilityToken.object;

    spyGetEIP20UtilityToken = sinon.replace(
      coGateway,
      'getEIP20UtilityToken',
      sinon.fake.resolves(eip20UtilityTokenContract),
    );

    spyApprove = sinon.replace(
      eip20UtilityTokenContract,
      'approve',
      sinon.fake.resolves(true),
    );

    spyCall = sinon.spy(coGateway, 'approveRedeemAmount');
  };
  const tearDown = () => {
    sinon.restore();
    mockEIP20UtilityToken.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    coGateway = new EIP20CoGateway(
      mosaic.auxiliary.web3,
      mosaic.auxiliary.contractAddresses.EIP20CoGateway,
    );
    redeemAmount = '10000';
    txOptions = {
      from: '0x0000000000000000000000000000000000000004',
      to: mosaic.origin.contractAddresses.EIP20Gateway,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw an error when redeem amount undefined', async () => {
    await AssertAsync.reject(
      coGateway.approveRedeemAmount(undefined, txOptions),
      `Invalid redeem amount: ${undefined}.`,
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    await AssertAsync.reject(
      coGateway.approveRedeemAmount(redeemAmount, undefined),
      `Invalid transaction options: ${undefined}.`,
    );
  });

  it('should throw an error when transaction options do not have from address', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      coGateway.approveRedeemAmount(redeemAmount, txOptions),
      `Invalid from address: ${undefined}.`,
    );
  });

  it('should pass when called with correct arguments', async () => {
    setup();
    const result = await coGateway.approveRedeemAmount(
      redeemAmount,
      txOptions,
    );

    assert.strictEqual(result, true, 'Result must be true');

    SpyAssert.assert(spyGetEIP20UtilityToken, 1, [[]]);
    SpyAssert.assert(spyApprove, 1, [
      [
        mosaic.auxiliary.contractAddresses.EIP20CoGateway,
        redeemAmount,
        txOptions,
      ],
    ]);
    SpyAssert.assert(spyCall, 1, [[redeemAmount, txOptions]]);

    tearDown();
  });
});
