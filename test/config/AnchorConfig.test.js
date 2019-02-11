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
