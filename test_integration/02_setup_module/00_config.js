'use strict';

const shared = require('../shared');

describe('Setup.config', () => {
  it('adds setup module to the shared config', () => {
    // Adding a new namespace as otherwise we have naming conflicts with addresses that were
    // deployed from "sequential setup".
    shared.setupModule = {};
  });
});
