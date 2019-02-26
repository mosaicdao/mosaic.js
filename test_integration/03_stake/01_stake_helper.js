'use strict';

const { assert } = require('chai');
const BN = require('bn.js');
const StakeHelper = require('../../src/helpers/StakeHelper');
const shared = require('../shared');

const validateReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');

  return receipt;
};

describe('StakeHelper', () => {
  const amountToStake = new BN('10000000000');
  let amountToApprove;

  it('should generate valid hashLock', () => {
    const expectedOutput = {
      secret: '5df052eb5e447cc3eddd8e3ebbe35ab0',
      unlockSecret:
        '0x3564663035326562356534343763633365646464386533656262653335616230',
      hashLock:
        '0x78a9ed63184870532c41557bbd5fa535a8a30073e9518a0485ae7880c33da5d4',
    };

    const { secret } = expectedOutput;

    const stakeHashLockInfo = StakeHelper.toHashLock(secret);
    assert.deepEqual(
      stakeHashLockInfo,
      expectedOutput,
      'Invalid toHashLock output,',
    );
  });

  it('should get staker nonce', () => {
    const helper = new StakeHelper();
    return helper
      .getNonce(
        shared.setupConfig.deployerAddress,
        shared.origin.web3,
        shared.origin.addresses.Gateway,
      )
      .then((stakerNonce) => {
        assert.equal(1, stakerNonce, 'Staker nonce should be 1');
      });
  });

  it('should get gateway bounty', () => {
    const helper = new StakeHelper();
    return helper
      .getBounty(
        shared.setupConfig.deployerAddress,
        shared.origin.web3,
        shared.origin.addresses.Gateway,
      )
      .then((bounty) => {
        const bnBounty = new BN(bounty);
        // The below amount will be reused in the following test.
        amountToApprove = bnBounty.add(amountToStake).toString(10);
        console.log('### Amount to approve', amountToApprove);
      });
  });

  it('should approve stake amount', () => {
    const helper = new StakeHelper();
    return helper
      .approveStakeAmount(
        amountToApprove,
        undefined,
        shared.origin.web3,
        shared.origin.addresses.EIP20Token,
        shared.origin.addresses.Gateway,
        shared.setupConfig.deployerAddress,
      )
      .then(validateReceipt);
  });

  it('should perform staking', () => {
    const helper = new StakeHelper(
      shared.origin.web3,
      shared.origin.addresses.EIP20Token,
      shared.origin.addresses.Gateway,
      shared.setupConfig.deployerAddress,
      undefined,
      // FIXME: The following line should become OST if #136 gets merged:
      shared.origin.addresses.EIP20Token,
    );

    // Only for testing purposes we re-use the same address:
    const beneficiary = shared.setupConfig.deployerAddress;
    const gasPrice = '0';
    const gasLimit = '10000000';

    return helper
      .perform(amountToStake, beneficiary, gasPrice, gasLimit)
      .then((output) => {
        validateReceipt(output.receipt);
      });
  });
});
