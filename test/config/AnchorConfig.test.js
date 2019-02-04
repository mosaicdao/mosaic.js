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

const AnchorConfig = require('../../src/config/AnchorConfig');

const { assert } = chai;

describe('AnchorConfig', () => {
  it('sets the correct parameters', () => {
    const config = {
      anchor: {
        origin: {
          address: '0x7dDccC2a3D94B18b4758D9C5255A8C3FAC5507a6',
          delay: 5,
        },
      },
    };
    const command = {};
    const target = 'origin';

    const anchorConfig = new AnchorConfig(config, command, target);

    assert.deepEqual(
      {
        target,
        ...config.anchor.origin,
      },
      anchorConfig,
    );
  });

  it('prefers command properties over config properties', () => {
    const config = {
      anchor: {
        auxiliary: {
          address: '0x7dDccC2a3D94B18b4758D9C5255A8C3FAC5507a6',
          delay: 5,
        },
      },
    };
    const command = {
      address: '0xE4F0C9FbB89B2131EfBf4DBa43EDE20489c3cf2b',
      delay: 1,
    };
    const target = 'auxiliary';

    const anchorConfig = new AnchorConfig(config, command, target);

    assert.deepEqual(
      {
        target,
        ...command,
      },
      anchorConfig,
    );
  });

  it('only accepts valid targets', () => {
    const config = {};
    const command = {};
    const invalidTarget = 'not_me';

    assert.throws(
      () => new AnchorConfig(config, command, invalidTarget),
      'argument `target` must be "origin" or "auxiliary"',
    );
  });

  it('only accepts valid ethereum addresses', () => {
    const config = {
      anchor: {
        auxiliary: {
          address: '0x123ccC2a3D94B18b4758D9C5255A8C3FAC5507a6',
          delay: 5,
        },
      },
    };
    const command = {};
    const target = 'auxiliary';

    assert.throws(
      () => new AnchorConfig(config, command, target),
      'given address is not a valid ethereum address: 0x123ccC2a3D94B18b4758D9C5255A8C3FAC5507a6',
    );
  });

  it('only accepts valid delays', () => {
    const config = {
      anchor: {
        auxiliary: {
          address: '0xE4F0C9FbB89B2131EfBf4DBa43EDE20489c3cf2b',
          delay: 'p',
        },
      },
    };
    const command = {};
    const target = 'auxiliary';

    assert.throws(
      () => new AnchorConfig(config, command, target),
      'given delay is not a valid number: p',
    );
  });
});
