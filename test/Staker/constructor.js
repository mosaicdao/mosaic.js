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

const chai = require('chai');

const assert = chai.assert;
const Staker = require('../../src/Staker/Staker');
const TestMosaic = require('../../test_utils/GetTestMosaic');

describe('Staker.constructor()', () => {
  let mosaic;

  beforeEach(() => {
    mosaic = TestMosaic.mosaic();
  });

  it('should throw an error when mosaic object is undefined', async () => {
    assert.throws(() => {
      new Staker();
    }, /Invalid mosaic object./);
  });

  it('should pass when called with correct arguments', async () => {
    const staker = new Staker(mosaic);
    assert.strictEqual(staker.mosaic, mosaic, 'Mosaic object is not set.');
    assert.strictEqual(
      staker.gatewayAddress,
      mosaic.origin.contractAddresses.EIP20Gateway,
      'Gateway address is not set',
    );
  });
});
