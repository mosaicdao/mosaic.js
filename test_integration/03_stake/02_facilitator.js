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

  it('should return nonce and message hash', async () => {
    const { hashLock } = Utils.createSecretHashLock();

    const facilitator = new Facilitator(mosaic);

    const response = await facilitator.stake(
      staker,
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      hashLock,
      txOptions,
    );

    assert.typeOf(response.messageHash, 'string', 'The message hash must be part of the response.');
    assert.strictEqual(response.nonce, '1', 'The nonce should be 1 for the first call.');
  });
});
