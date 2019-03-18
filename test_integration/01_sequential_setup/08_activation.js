'use strict';

const { assert } = require('chai');

const AnchorHelper = require('../../src/helpers/setup/AnchorHelper');
const GatewayHelper = require('../../src/helpers/setup/GatewayHelper');
const OSTPrimeHelper = require('../../src/helpers/setup/OSTPrimeHelper');

const shared = require('../shared');

const assertReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

describe('Activate deployed contracts', () => {
  // This step is not strictly neccessary but recommended
  it('should set coAnchor', () => {
    const addressCoAnchor = shared.auxiliary.addresses.Anchor;
    const txOptions = {
      from: shared.setupConfig.organizationOwner,
    };

    const subject = new AnchorHelper(
      shared.origin.web3,
      shared.auxiliary.web3,
      shared.origin.addresses.Anchor,
    );
    return subject
      .setCoAnchorAddress(addressCoAnchor, txOptions)
      .then(assertReceipt);
  });

  it('should set CoGateway on OSTPrime', () => {
    const addressCoGateway = shared.auxiliary.addresses.EIP20CoGateway;
    const txOptions = {
      from: shared.setupConfig.organizationOwner,
    };

    const subject = new OSTPrimeHelper(
      shared.auxiliary.web3,
      shared.auxiliary.addresses.OSTPrime,
    );
    return subject
      .setCoGateway(addressCoGateway, txOptions)
      .then(assertReceipt);
  });

  it('should activate gateway', () => {
    const addressCoGateway = shared.auxiliary.addresses.EIP20CoGateway;
    const txOptions = {
      from: shared.setupConfig.organizationOwner,
    };

    const subject = new GatewayHelper(
      shared.origin.web3,
      shared.origin.addresses.EIP20Gateway,
    );
    return subject
      .activateGateway(addressCoGateway, txOptions)
      .then(assertReceipt);
  });
});
