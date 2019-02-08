const chai = require('chai');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const EIP20Token = require('../../src/ContractInteract/EIP20Token');
const SpyAssert = require('../../test_utils/SpyAssert');
const AssertAsync = require('../../test_utils/AssertAsync');
const TestMosaic = require('../../test_utils/GetTestMosaic');

const { assert } = chai;

describe('EIP20Gateway.approveStakeAmount()', () => {
  let mosaic;
  let stakeAmount;
  let txOptions;
  let gateway;

  let spyGetEIP20ValueToken;
  let mockEIP20ValueToken;
  let spyApprove;
  let spyCall;

  const setup = () => {
    mockEIP20ValueToken = sinon.mock(
      new EIP20Token(
        mosaic.origin.web3,
        '0x0000000000000000000000000000000000000004',
      ),
    );
    const eip20ValueTokenContract = mockEIP20ValueToken.object;

    spyGetEIP20ValueToken = sinon.replace(
      gateway,
      'getEIP20ValueToken',
      sinon.fake.resolves(eip20ValueTokenContract),
    );

    spyApprove = sinon.replace(
      eip20ValueTokenContract,
      'approve',
      sinon.fake.resolves(true),
    );

    spyCall = sinon.spy(gateway, 'approveStakeAmount');
  };
  const tearDown = () => {
    sinon.restore();
    mockEIP20ValueToken.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
    gateway = new EIP20Gateway(
      mosaic.origin.web3,
      mosaic.origin.contractAddresses.EIP20Gateway,
    );
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
      gateway.approveStakeAmount(undefined, txOptions),
      `Invalid stake amount: ${undefined}.`,
    );
  });

  it('should throw an error when transaction options is undefined', async () => {
    await AssertAsync.reject(
      gateway.approveStakeAmount(stakeAmount, undefined),
      `Invalid transaction options: ${undefined}.`,
    );
  });

  it('should throw an error when transaction options do not have from address', async () => {
    delete txOptions.from;
    await AssertAsync.reject(
      gateway.approveStakeAmount(stakeAmount, txOptions),
      `Invalid from address: ${undefined}.`,
    );
  });

  it('should pass when called with correct arguments', async () => {
    setup();
    const result = await gateway.approveStakeAmount(stakeAmount, txOptions);

    assert.strictEqual(result, true, 'Result must be true');

    SpyAssert.assert(spyGetEIP20ValueToken, 1, [[]]);
    SpyAssert.assert(spyApprove, 1, [
      [mosaic.origin.contractAddresses.EIP20Gateway, stakeAmount, txOptions],
    ]);
    SpyAssert.assert(spyCall, 1, [[stakeAmount, txOptions]]);

    tearDown();
  });
});
