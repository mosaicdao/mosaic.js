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
