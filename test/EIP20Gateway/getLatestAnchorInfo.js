'use strict';

const { assert } = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20Gateway = require('../../src/ContractInteract/EIP20Gateway');
const Anchor = require('../../src/ContractInteract/Anchor');
const SpyAssert = require('../../test_utils/SpyAssert');

describe('EIP20Gateway.getLatestAnchorInfo()', () => {
  let web3;
  let gatewayAddress;
  let gateway;

  let mockedAnchor;
  let getLatestAnchorInfoResult;

  let spyCall;
  let spyGetAnchor;
  let spyGetLatestAnchorInfo;

  const setup = () => {
    const anchor = new Anchor(
      web3,
      '0x0000000000000000000000000000000000000003',
    );
    mockedAnchor = sinon.mock(anchor);
    spyGetLatestAnchorInfo = sinon.replace(
      mockedAnchor.object,
      'getLatestInfo',
      sinon.fake.resolves(getLatestAnchorInfoResult),
    );
    spyGetAnchor = sinon.replace(
      gateway,
      'getAnchor',
      sinon.fake.resolves(mockedAnchor.object),
    );
    spyCall = sinon.spy(gateway, 'getLatestAnchorInfo');
  };

  const tearDown = () => {
    mockedAnchor.restore();
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    gatewayAddress = '0x0000000000000000000000000000000000000002';
    gateway = new EIP20Gateway(web3, gatewayAddress);
    getLatestAnchorInfoResult = true;
  });

  it('should return anchor object', async () => {
    setup();
    const result = await gateway.getLatestAnchorInfo();
    assert.isTrue(result, 'Result of getLatestAnchorInfo must be true');

    SpyAssert.assert(spyCall, 1, [[]]);
    SpyAssert.assert(spyGetAnchor, 1, [[]]);
    SpyAssert.assert(spyGetLatestAnchorInfo, 1, [[]]);

    tearDown();
  });
});
