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
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const TestMosaic = require('../../test_utils/GetTestMosaic');
const assert = chai.assert;

describe('EIP20Gateway.approveBountyAmount()', () => {
  let mosaic;
  let bountyAmount;
  let txOptions;
  let gateway;

  let spyGetBounty;
  let spyGetEIP20BaseToken;
  let mockEIP20BaseToken;
  let spyApprove;
  let spyCall;

  const setup = () => {
    mockEIP20BaseToken = sinon.mock(
      new EIP20Token(
        mosaic.origin.web3,
        '0x0000000000000000000000000000000000000004',
      ),
    );
    const eip20BaseTokenContract = mockEIP20BaseToken.object;

    spyGetBounty = sinon.replace(
      gateway,
      'getBounty',
      sinon.fake.resolves(bountyAmount),
    );

    spyGetEIP20BaseToken = sinon.replace(
      gateway,
      'getEIP20BaseToken',
      sinon.fake.resolves(eip20BaseTokenContract),
    );

    spyApprove = sinon.replace(
      eip20BaseTokenContract,
      'approve',
      sinon.fake.resolves(true),
    );

    spyCall = sinon.spy(gateway, 'approveBountyAmount');
  };
  const tearDown = () => {
    sinon.restore();
    mockEIP20BaseToken.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    gateway = new EIP20Gateway(
      mosaic.origin.web3,
      mosaic.origin.contractAddresses.EIP20Gateway,
    );
    bountyAmount = '10000';
    txOptions = {
      from: '0x0000000000000000000000000000000000000004',
      to: mosaic.origin.contractAddresses.EIP20Gateway,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw an error when transaction options is undefined', async () => {
    await AssertAsync.reject(
      gateway.approveBountyAmount(undefined),
      `Invalid transaction options: ${undefined}.`,
    );
  });

  it('should throw an error when transaction options do not have from address', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      gateway.approveBountyAmount(txOptions),
      `Invalid from address: ${undefined}.`,
    );
  });

  it('should pass when called with correct arguments', async () => {
    setup();
    const result = await gateway.approveBountyAmount(txOptions);

    assert.strictEqual(result, true, 'Result must be true');

    SpyAssert.assert(spyGetBounty, 1, [[]]);
    SpyAssert.assert(spyGetEIP20BaseToken, 1, [[]]);
    SpyAssert.assert(spyApprove, 1, [
      [mosaic.origin.contractAddresses.EIP20Gateway, bountyAmount, txOptions],
    ]);
    SpyAssert.assert(spyCall, 1, [[txOptions]]);

    tearDown();
  });
});
