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

'use strict';

const { assert } = require('chai');

const AnchorHelper = require('../../libs/helpers/setup/AnchorHelper');
const GatewayHelper = require('../../libs/helpers/setup/GatewayHelper');
const OSTPrimeHelper = require('../../libs/helpers/setup/OSTPrimeHelper');

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
    const addressCoGateway = shared.auxiliary.addresses.CoGateway;
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
    const addressCoGateway = shared.auxiliary.addresses.CoGateway;
    const txOptions = {
      from: shared.setupConfig.organizationOwner,
    };

    const subject = new GatewayHelper(
      shared.origin.web3,
      shared.origin.addresses.Gateway,
    );
    return subject
      .activateGateway(addressCoGateway, txOptions)
      .then(assertReceipt);
  });
});
