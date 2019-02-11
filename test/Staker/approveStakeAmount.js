'use strict';

const { assert } = require('chai');
const sinon = require('sinon');
const Staker = require('../../src/Staker');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const TestMosaic = require('../../test_utils/TestMosaic');

describe('Staker.approveStakeAmount()', () => {
  let mosaic;
  let staker;
  let stakeAmount;
  let txOptions;

  let spyGetEIP20ValueToken;
  let mockEIP20Token;
  let spyApprove;
  let spyCall;

  const setup = () => {
    mockEIP20Token = sinon.createStubInstance(EIP20Token);
    const eip20TokenContract = mockEIP20Token;

    spyGetEIP20ValueToken = sinon.replace(
      staker.gatewayContract,
      'getEIP20ValueToken',
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
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    staker = new Staker(mosaic);
    stakeAmount = '10000';
    txOptions = {
      from: '0x0000000000000000000000000000000000000004',
      to: mosaic.origin.contractAddresses.EIP20Gateway,
      gasLimit: 0,
      gasPrice: 0,
      value: 0,
    };
  });

  it('should throw an error when stake amount undefined', async () => {
    await AssertAsync.reject(
      staker.approveStakeAmount(undefined, txOptions),
      'Invalid stake amount: undefined.',
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    await AssertAsync.reject(
      staker.approveStakeAmount(stakeAmount, undefined),
      'Invalid transaction options: undefined.',
    );
  });

  it('should throw an error when transaction options do not have staker address', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      staker.approveStakeAmount(stakeAmount, txOptions),
      'Invalid staker address: undefined.',
    );
  });

  it('should pass when called with correct arguments', async () => {
    setup();
    const result = await staker.approveStakeAmount(stakeAmount, txOptions);
    assert.strictEqual(result, true, 'Result must be true');

    SpyAssert.assert(spyGetEIP20ValueToken, 1, [[]]);
    SpyAssert.assert(spyApprove, 1, [
      [mosaic.origin.contractAddresses.EIP20Gateway, stakeAmount, txOptions],
    ]);
    SpyAssert.assert(spyCall, 1, [[stakeAmount, txOptions]]);

    tearDown();
  });
});
