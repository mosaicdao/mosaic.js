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

const chai = require('chai');
const sinon = require('sinon');
const Web3 = require('web3');
const Facilitator = require('../../libs/Facilitator/Facilitator');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('Facilitator.getValueToken()', () => {
    let facilitator;
    let web3;
    let gatewayAddress;
    let coGatewayAddress;

    beforeEach(() => {
        // runs before each test in this block
        web3 = new Web3();
        gatewayAddress = '0x0000000000000000000000000000000000000001';
        coGatewayAddress = '0x0000000000000000000000000000000000000002';
        facilitator = new Facilitator(web3, web3, gatewayAddress, coGatewayAddress);
    });

    it('should return correct base token', async function() {
        this.timeout(5000);

        const expectedValueTokenAddress = '0x0000000000000000000000000000000000000003';

        // Mock an instance of gateway contract.
        const mockGatewayContract = sinon.mock(facilitator.contracts.Gateway(gatewayAddress));
        const gatewayContract = mockGatewayContract.object;

        // Fake the value token call.
        const spyToken = sinon.replace(
            gatewayContract.methods,
            'token',
            sinon.fake.returns(function() {
                return Promise.resolve(expectedValueTokenAddress);
            }),
        );

        // Fake the Gateway call to return gatewayContract object;
        const spyGateway = sinon.replace(facilitator.contracts, 'Gateway', sinon.fake.returns(gatewayContract));

        // Add spy on Facilitator.getValueToken.
        const spy = sinon.spy(facilitator, 'getValueToken');

        // Get value token address.
        const valueToken = await facilitator.getValueToken();

        // Assert the returned value.
        assert.strictEqual(valueToken, expectedValueTokenAddress, 'Value token address must not be different.');

        SpyAssert.assert(spyToken, 1, [[gatewayAddress]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spy, 1, [[]]);

        // Restore all mocked and spy objects.
        mockGatewayContract.restore();
        spy.restore();
        sinon.restore();
    });
});
