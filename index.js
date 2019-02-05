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

const Mosaic = require('./src/Mosaic');
const Chain = require('./src/Chain');
const AbiBinProvider = require('./src/AbiBinProvider');
const ChainSetup = require('./src/ChainSetup');
const Contracts = require('./src/Contracts');
const StakeHelper = require('./src/helpers/StakeHelper');
const TypedData = require('./src/utils/EIP712SignerExtension/TypedData');
const Facilitator = require('./src/Facilitator/Facilitator');
const Staker = require('./src/Staker/Staker');
const Redeemer = require('./src/Redeemer/Redeemer');

require('./src/utils/EIP712SignerExtension/extender')();

module.exports = {
  Mosaic,
  Chain,
  AbiBinProvider,
  ChainSetup,
  Contracts,
  Helpers: {
    StakeHelper,
  },
  Utils: {
    EIP712TypedData: TypedData,
  },
  Facilitator,
  Staker,
  Redeemer,
};
