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

const Target = require('../../src/config/Target');

const { assert } = chai;

describe('Target', () => {
  it('provides the correct options', () => {
    assert.deepEqual(
      {
        ORIGIN: 'origin',
        AUXILIARY: 'auxiliary',
      },
      Target,
      'Target does not expose the expected parameters.',
    );
  });

  it('cannot be updated', () => {
    assert.throws(() => {
      Target.origin = 'fancy_chain';
    }, 'Cannot add property origin, object is not extensible');

    assert.throws(() => {
      Target.new_property = 'ice_cream';
    }, 'Cannot add property new_property, object is not extensible');
  });
});
