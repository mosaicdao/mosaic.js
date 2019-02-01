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

const chai = require('chai');
const Web3 = require('web3');

const Chain = require('../src/Chain');
const MosaicChains = require('../src/MosaicChains');

const { assert } = chai;

describe('MosaicChains', () => {
  // This is not used to actually make calls, only to assert correct parameters.
  const web3ProviderOrigin = 'http://localhost:8545';
  const web3Origin = new Web3(web3ProviderOrigin);
  const web3ProviderAuxiliary = 'http://localhost:8546';
  const web3Auxiliary = new Web3(web3ProviderAuxiliary);

  const contractAddressesOrigin = {
    Anchor: 'anchor',
    Token: 'token',
  };
  const contractAddressesAuxiliary = {
    Anchor: 'anchorAux',
    EIP20CoGateway: 'cogateway',
  };

  const origin = new Chain(web3Origin, contractAddressesOrigin);
  const auxiliary = new Chain(web3Auxiliary, contractAddressesAuxiliary);

  it('sets the correct parameters', () => {
    const mosaicChains = new MosaicChains(origin, auxiliary);

    assert.deepEqual(
      origin,
      mosaicChains.origin,
      'MosaicChains did not set the correct origin chain parameter on construction.',
    );
    assert.deepEqual(
      auxiliary,
      mosaicChains.auxiliary,
      'MosaicChains did not set the correct auxiliary chain parameter on construction.',
    );
  });

  it('makes the parameters read-only', () => {
    const mosaicChains = new MosaicChains(origin, auxiliary);

    assert.throws(() => {
      mosaicChains.origin = new Chain(web3Origin, contractAddressesOrigin);
    }, /Cannot assign to read only property/);
    assert.throws(() => {
      mosaicChains.auxiliary = new Chain(
        web3Auxiliary,
        contractAddressesAuxiliary,
      );
    }, /Cannot assign to read only property/);
  });

  it('checks for the correct argument types', () => {
    assert.throws(
      () => new MosaicChains({}, auxiliary),
      'origin must be an instance of Chain.',
    );
    assert.throws(
      () => new MosaicChains(origin, {}),
      'auxiliary must be an instance of Chain.',
    );
  });
});
