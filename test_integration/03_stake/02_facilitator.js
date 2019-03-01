'use strict';

const { assert } = require('chai');

const Chain = require('../../src/Chain');
const Facilitator = require('../../src/Facilitator');
const Mosaic = require('../../src/Mosaic');
const Utils = require('../../src/utils/Utils');
const shared = require('../shared');

describe('Facilitator.stake()', () => {
  const amount = '1000000000';
  const gasPrice = '5';
  const gasLimit = '20000000';

  let staker;
  let beneficiary;
  let txOptions;
  let mosaic;

  let hashLock;

  beforeEach(() => {
    staker = shared.setupConfig.deployerAddress;
    beneficiary = shared.setupConfig.deployerAddress;
    txOptions = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.origin.gasPrice,
      gas: 7000000,
    };

    // Using the gateways from the setup module, as the other gateway has already been staked in the
    // previous integration test `01_stake_helper.js`.
    const origin = new Chain(
      shared.origin.web3,
      { EIP20Gateway: shared.setupModule.originGateway },
    );
    const auxiliary = new Chain(
      shared.auxiliary.web3,
      { EIP20CoGateway: shared.setupModule.auxiliaryCoGateway },
    );
    mosaic = new Mosaic(origin, auxiliary);
  });

  it('should stake', async () => {
    hashLock = Utils.createSecretHashLock();

    const facilitator = new Facilitator(mosaic);

    const response = await facilitator.stake(
      staker,
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      hashLock.hashLock,
      txOptions,
    );

    assert.typeOf(response.messageHash, 'string', 'The message hash must be part of the response.');
    assert.strictEqual(response.nonce, '1', 'The nonce should be 1 for the first call.');
  });

  // FIXME: Add this test as soon as we use a test node that can generate proofs.
  // The current augurproject/dev-node-geth cannot.
  // Response to getting proof:
  // {"jsonrpc":"2.0","id":1551373707415,"result":null}
  //
  // Use `response` from previous test to access required fields.
  //
  // it('should progress stake', async () => {
  //   // First we need to make the state root known on target.
  //   const anchor = new Anchor(shared.auxiliary.web3, shared.auxiliary.addresses.Anchor);
  //   const block = await shared.origin.web3.eth.getBlock('latest');
  //   await anchor.anchorStateRoot(
  //     block.number.toString(),
  //     block.stateRoot,
  //     {
  //       ...txOptions,
  //       from: shared.setupConfig.organizationOwner,
  //     },
  //   );
  //
  //   console.log('Progressing Stake');
  //   const facilitator = new Facilitator(mosaic);
  //   await facilitator.progressStake(
  //     staker,
  //     amount,
  //     beneficiary,
  //     gasPrice,
  //     gasLimit,
  //     stakingResponse.nonce.toString(),
  //     hashLock.hashLock,
  //     hashLock.unlockSecret,
  //     txOptions,
  //     txOptions,
  //   );
  // });
});
