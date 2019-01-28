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

const sinon = require('sinon');
const Web3 = require('web3');
const web3Provider = require('web3-providers-http');
const Facilitator = require('../libs/Facilitator/Facilitator');

describe('Facilitator.getGatewayNonce()', () => {
  let facilitator;
  let web3;
  let gatewayAddress;
  let coGatewayAddress;

  beforeEach(() => {
    // runs before each test in this block
    web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9546'));
    gatewayAddress = '0x52c50cC9bBa156C65756abd71b172B6408Dde006';
    coGatewayAddress = '0xbF03E1680258c70B86D38A7e510F559A6440D06e';
    facilitator = new Facilitator(
      web3,
      web3,
      gatewayAddress,
      coGatewayAddress
    );
  });

  it('should fake a jQuery ajax request', async function() {
    this.timeout(5000);

    const fake = sinon.fake.yields(
      JSON.parse(
        '{"jsonrpc":"2.0","id":1,"method":"eth_call","result":"0x01"}'
      )
    );

    sinon.replace(web3Provider.prototype, 'send', fake);

    const nonce = await facilitator.getGatewayNonce(
      '0x52c50cC9bBa156C65756abd71b172B6408Dde006'
    );
    console.log('nonce: ', nonce);
  });
});
