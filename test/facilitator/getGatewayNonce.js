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

describe('Facilitator.getGatewayNonce()', () => {
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

    it('should throw error when account address is not string', async function() {
        this.timeout(5000);

        const accountAddress = 0x0000000000000000000000000000000000000003;
        const expectedErrorMessage = 'Invalid account address.';
        // Call getGatewayNonce.
        await facilitator.getGatewayNonce(accountAddress).catch((exception) => {
            assert.strictEqual(
                exception.message,
                expectedErrorMessage,
                `Exception reason must be "${expectedErrorMessage}"`,
            );
        });

        // Call with undefined account address.
        await facilitator.getGatewayNonce().catch((exception) => {
            assert.strictEqual(
                exception.message,
                expectedErrorMessage,
                `Exception reason must be "${expectedErrorMessage}"`,
            );
        });
    });

    it('should return correct nonce value', async function() {
        this.timeout(5000);

        const accountAddress = '0x79376dc1925ba1e0276473244802287394216a39';

        // Mock an instance of gateway contract.
        const mockGatewayContract = sinon.mock(facilitator.contracts.Gateway(gatewayAddress));
        const gatewayContract = mockGatewayContract.object;

        // Fake the getNonce call.
        const spyGetNonce = sinon.replace(
            gatewayContract.methods,
            'getNonce',
            sinon.fake.returns(function() {
                return Promise.resolve(1);
            }),
        );

        // Fake the Gateway call to return gatewayContract object;
        const spyGateway = sinon.replace(facilitator.contracts, 'Gateway', sinon.fake.returns(gatewayContract));

        // Add spy on Facilitator.getGatewayNonce.
        const spy = sinon.spy(facilitator, 'getGatewayNonce');

        // Call getGatewayNonce.
        const nonce = await facilitator.getGatewayNonce(accountAddress);

        // Assert the returned value.
        assert.strictEqual(nonce, 1, 'Nonce must be equal.');

        SpyAssert.assert(spyGetNonce, 1, [[accountAddress]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spy, 1, [[accountAddress]]);

        // Restore all mocked and spy objects.
        mockGatewayContract.restore();
        spy.restore();
        sinon.restore();
    });
});
