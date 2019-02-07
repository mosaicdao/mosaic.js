'use strict';

const chai = require('chai');
const path = require('path');

const AbiBinProvider = require('../../src/AbiBinProvider');

const { assert } = chai;

describe('AbiBinProvider.constructor()', () => {
  it('loads contracts from directories provided as constructor parameters', () => {
    const abiDir = path.join(__dirname, './data/abi');
    const binDir = path.join(__dirname, './data/bin');

    let provider;
    assert.doesNotThrow(
      () => (provider = new AbiBinProvider(abiDir, binDir)),
      Error,
      undefined,
      'AbiBinProvider constructor with directory arguments should not throw an error',
    );
    const contractAbi = provider.getABI('MockToken');

    assert.isArray(
      contractAbi,
      'MockToken ABI was not loaded correctly from directory',
    );
  });
});
