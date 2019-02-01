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
      organizationWorker: accountsOrigin[0],
    };
  });
});
