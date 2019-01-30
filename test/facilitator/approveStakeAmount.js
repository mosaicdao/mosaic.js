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

describe('Facilitator.approveStakeAmount()', () => {
    let facilitator;
    let web3;
    let gatewayAddress;
    let coGatewayAddress;
    let valueTokenAddress;
    let stakerAddress;
    let stakeAmount;

    let mockValueTokenContract;
    let mockTx;

    let spyApproveStakeAmount;
    let spyGetValueToken;
    let spyTxSend;
    let spyValueTokenApprove;

    const setup = function() {
        // Mock facilitator.getValueToken method to return expected value token address.
        spyGetValueToken = sinon.replace(facilitator, 'getValueToken', sinon.fake.returns(valueTokenAddress));

        // Mock an instance of ValueToken contract.
        mockValueTokenContract = sinon.mock(facilitator.contracts.ValueToken(valueTokenAddress));
        const valueTokenContract = mockValueTokenContract.object;

        // Mock approve transaction object.
        mockTx = sinon.mock(valueTokenContract.methods.approve(gatewayAddress, stakeAmount));

        spyTxSend = sinon.replace(
            mockTx.object,
            'send',
            sinon.fake.resolves({
                account: gatewayAddress,
                amount: stakeAmount,
            }),
        );

        // Fake the approve call.
        spyValueTokenApprove = sinon.replace(valueTokenContract.methods, 'approve', sinon.fake.returns(mockTx.object));

        // Fake value token contract instance;
        sinon.replace(facilitator.contracts, 'ValueToken', sinon.fake.returns(valueTokenContract));

        sinon.stub(facilitator, 'sendTransaction').callsFake((tx, txOptions) => {
            return new Promise(async function(resolve, reject) {
                const sendResult = await tx.send();
                resolve({ txResult: sendResult, txOptions: txOptions });
            });
        });

        // Add spy on Facilitator.approveStakeAmount.
        spyApproveStakeAmount = sinon.spy(facilitator, 'approveStakeAmount');
    };

    const tearDown = function() {
        // Restore all mocked and spy objects.
        mockValueTokenContract.restore();
        mockTx.restore();
        spyApproveStakeAmount.restore();
        sinon.restore();
    };

    beforeEach(() => {
        // runs before each test in this block
        web3 = new Web3();
        gatewayAddress = '0x0000000000000000000000000000000000000001';
        coGatewayAddress = '0x0000000000000000000000000000000000000002';
        facilitator = new Facilitator(web3, web3, gatewayAddress, coGatewayAddress);

        valueTokenAddress = '0x0000000000000000000000000000000000000003';
        stakerAddress = '0x0000000000000000000000000000000000000004';
        stakeAmount = 100;
    });

    it('should fail when staker address is invalid', async function() {
        this.timeout(5000);
        const expectedErrorMessage = 'Invalid staker address.';
        await facilitator.approveStakeAmount().catch((exception) => {
            assert.strictEqual(
                exception.message,
                expectedErrorMessage,
                `Exception reason must be "${expectedErrorMessage}"`,
            );
        });
    });

    it('should approve stake amount with default gas value', async function() {
        this.timeout(5000);

        setup();

        // Call approve.
        const result = await facilitator.approveStakeAmount(stakerAddress, stakeAmount);

        assert.strictEqual(
            result.txResult.account,
            gatewayAddress,
            'Account address must be gateway contract address.',
        );
        assert.strictEqual(result.txResult.amount, stakeAmount, 'Stake amount must be equal to expected stake amount.');
        assert.strictEqual(result.txOptions.from, stakerAddress, 'From address must be staker address.');
        assert.strictEqual(result.txOptions.to, valueTokenAddress, 'To address must be value token address.');
        assert.strictEqual(result.txOptions.gas, '7000000', 'Gas value must be equal to default value.');

        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakerAddress, stakeAmount]]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyTxSend, 1, [[]]);
        SpyAssert.assert(spyValueTokenApprove, 1, [[gatewayAddress, stakeAmount]]);

        tearDown();
    });

    it('should approve stake amount when gas amount is provided in argument', async function() {
        this.timeout(5000);

        stakeAmount = 50000;
        const gas = 100000;

        setup();

        // Call approve.
        const result = await facilitator.approveStakeAmount(stakerAddress, stakeAmount, gas);

        assert.strictEqual(
            result.txResult.account,
            gatewayAddress,
            'Account address must be gateway contract address.',
        );
        assert.strictEqual(result.txResult.amount, stakeAmount, 'Stake amount must be equal to expected stake amount.');
        assert.strictEqual(result.txOptions.from, stakerAddress, 'From address must be staker address.');
        assert.strictEqual(result.txOptions.to, valueTokenAddress, 'To address must be base token address.');
        assert.strictEqual(result.txOptions.gas, gas, 'Gas value must be equal to default value.');

        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakerAddress, stakeAmount, gas]]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyTxSend, 1, [[]]);
        SpyAssert.assert(spyValueTokenApprove, 1, [[gatewayAddress, stakeAmount]]);

        tearDown();
    });
});
