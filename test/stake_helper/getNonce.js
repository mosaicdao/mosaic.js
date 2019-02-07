const { assert } = require('chai');
const sinon = require('sinon');
const StakeHelper = require('../../src/helpers/StakeHelper');
const SpyAssert = require('../../test_utils/SpyAssert');
const TestMosaic = require('../../test_utils/TestMosaic');
const AssertAsync = require('../../test_utils/AssertAsync');

describe('StakeHelper.getNonce()', () => {
  let stakeHelper;
  let mosaic;

  beforeEach(() => {
    // runs before each test in this block
    mosaic = TestMosaic.mosaic();
    stakeHelper = new StakeHelper(
      mosaic.origin.web3,
      mosaic.auxiliary.web3,
      mosaic.origin.contractAddresses.EIP20Gateway,
      mosaic.auxiliary.contractAddresses.EIP20CoGateway,
    );
  });

  it('should throw error when account address is not string', async function() {
    this.timeout(5000);

    const accountAddress = 0x0000000000000000000000000000000000000003;
    await AssertAsync.reject(
      stakeHelper.getNonce(accountAddress),
      `Invalid account address: ${accountAddress}.`,
    );
  });

  it('should return correct nonce value', async function() {
    const accountAddress = '0x79376dc1925ba1e0276473244802287394216a39';

    // Add spy on stakeHelper.getGatewayNonce.
    const spy = sinon.spy(stakeHelper, 'getNonce');

    const spyNonce = sinon.replace(
      stakeHelper,
      '_getNonce',
      sinon.fake.resolves(1),
    );

    // Call getNonce.
    const nonce = await stakeHelper.getNonce(accountAddress);

    // Assert the returned value.
    assert.strictEqual(nonce, 1, 'Nonce must be equal.');

    SpyAssert.assert(spyNonce, 1, [
      [
        accountAddress,
        mosaic.origin.web3,
        mosaic.origin.contractAddresses.EIP20Gateway,
      ],
    ]);
    SpyAssert.assert(spy, 1, [[accountAddress]]);

    // Restore all mocked and spy objects.
    spy.restore();
    sinon.restore();
  });
});
