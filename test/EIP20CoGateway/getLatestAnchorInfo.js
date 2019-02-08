'use strict';

const chai = require('chai');
const Web3 = require('web3');
const sinon = require('sinon');
const EIP20CoGateway = require('../../src/ContractInteract/EIP20CoGateway');
const Anchor = require('../../src/ContractInteract/Anchor');
const SpyAssert = require('../../test_utils/SpyAssert');

const { assert } = chai;

describe('EIP20CoGateway.getLatestAnchorInfo()', () => {
  let web3;
  let coGatewayAddress;
  let coGateway;

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
      'getLatestAnchorInfo',
      sinon.fake.resolves(getLatestAnchorInfoResult),
    );
    spyGetAnchor = sinon.replace(
      coGateway,
      'getAnchor',
      sinon.fake.resolves(mockedAnchor.object),
    );
    spyCall = sinon.spy(coGateway, 'getLatestAnchorInfo');
  };

  const tearDown = () => {
    mockedAnchor.restore();
    sinon.restore();
    spyCall.restore();
  };

  beforeEach(() => {
    web3 = new Web3();
    coGatewayAddress = '0x0000000000000000000000000000000000000002';
    coGateway = new EIP20CoGateway(web3, coGatewayAddress);
    getLatestAnchorInfoResult = true;
  });

  it('should return anchor object', async () => {
    setup();
    const result = await coGateway.getLatestAnchorInfo();
    assert.isTrue(result, 'Result of getLatestAnchorInfo must be true');

    SpyAssert.assert(spyCall, 1, [[]]);
    SpyAssert.assert(spyGetAnchor, 1, [[]]);
    SpyAssert.assert(spyGetLatestAnchorInfo, 1, [[]]);

    tearDown();
  });
});
