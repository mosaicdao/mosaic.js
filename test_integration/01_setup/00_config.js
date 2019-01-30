'use strict';

const shared = require('../shared');

describe('Setup Helpers - Config', () => {
  // doing this in a test instead of before hook,
  // because before hook doesn't trigger when there are no tests
  it('should set setupConfig', async () => {
    const accountsOrigin = await shared.origin.web3.eth.getAccounts();
    shared.setupConfig = {
      chainOwner: accountsOrigin[0],
      deployerAddress: accountsOrigin[0],
      organizationOwner: accountsOrigin[1],
      organizationAdmin: accountsOrigin[2],
      organizationWorker: accountsOrigin[0]
    };
  });
});
