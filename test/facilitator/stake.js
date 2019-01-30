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

const BN = require('bn.js');
const chai = require('chai');
const sinon = require('sinon');
const Web3 = require('web3');
const Facilitator = require('../../libs/Facilitator/Facilitator');
const SpyAssert = require('../../test_utils/SpyAssert');

const assert = chai.assert;

describe('Facilitator.stake()', () => {
    let facilitator;
    let originWeb3;
    let auxiliaryWeb3;
    let gatewayAddress;
    let coGatewayAddress;
    let stakeParams = {};

    let valueTokenAddress;
    let baseTokenAddress;
    let bountyAmount;
    let stakerNonce;
    let hashLockObj;

    let mockTx;
    let mockGatewayContract;
    let spyStakeCall;
    let spyStake;
    let spyGetBaseToken;
    let spyGetGatewayNonce;
    let spyGetHashLock;
    let spyGetBounty;
    let spyApproveStakeAmount;
    let spyApproveBountyAmount;
    let spySend;
    let spyGateway;
    let spyGetValueToken;

    const setup = function() {
        // Mock facilitator.getValueToken method to return expected value token address.
        spyGetValueToken = sinon.replace(facilitator, 'getValueToken', sinon.fake.returns(valueTokenAddress));

        // Mock facilitator.getBaseToken method to return expected base token address.
        spyGetBaseToken = sinon.replace(facilitator, 'getBaseToken', sinon.fake.returns(baseTokenAddress));

        // Mock facilitator.getGatewayNonce method to return expected nonce from gateway.
        spyGetGatewayNonce = sinon.replace(facilitator, 'getGatewayNonce', sinon.fake.returns(stakerNonce));

        // Mock facilitator.getHashLock method to return expected nonce from gateway.
        spyGetHashLock = sinon.replace(facilitator, 'getHashLock', sinon.fake.returns(hashLockObj));

        // Mock facilitator.getBounty method to return expected bounty amount
        spyGetBounty = sinon.replace(facilitator, 'getBounty', sinon.fake.returns(bountyAmount));

        // Mock facilitator.approveStakeAmount method to return expected bounty amount
        spyApproveStakeAmount = sinon.replace(facilitator, 'approveStakeAmount', sinon.fake.returns(true));

        // Mock facilitator.approveBountyAmount method to return expected bounty amount
        spyApproveBountyAmount = sinon.replace(facilitator, 'approveBountyAmount', sinon.fake.returns(true));

        // Mock an instance of gateway contract.
        mockGatewayContract = sinon.mock(facilitator.contracts.Gateway(gatewayAddress));

        const gatewayContract = mockGatewayContract.object;

        // Mock approve transaction object.
        mockTx = sinon.mock(
            gatewayContract.methods.stake(
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakerNonce,
                hashLockObj.hashLock,
            ),
        );

        // Mock stake call.
        spyStake = sinon.replace(gatewayContract.methods, 'stake', sinon.fake.returns(mockTx.object));

        // Mock send call.
        spySend = sinon.replace(mockTx.object, 'send', sinon.fake.resolves(true));

        spyGateway = sinon.replace(facilitator.contracts, 'Gateway', sinon.fake.returns(gatewayContract));

        sinon.stub(facilitator, 'sendTransaction').callsFake((tx, txOptions) => {
            return new Promise(async function(resolve, reject) {
                const sendResult = await tx.send();
                resolve({ txResult: sendResult, txOptions: txOptions });
            });
        });

        spyStakeCall = sinon.spy(facilitator, 'stake');
    };

    const tearDown = function() {
        mockTx.restore();
        mockGatewayContract.restore();
        sinon.restore();
        spyStakeCall.restore();
    };

    beforeEach(() => {
        originWeb3 = new Web3();
        auxiliaryWeb3 = new Web3();
        gatewayAddress = '0x0000000000000000000000000000000000000001';
        coGatewayAddress = '0x0000000000000000000000000000000000000002';
        facilitator = new Facilitator(originWeb3, auxiliaryWeb3, gatewayAddress, coGatewayAddress);
        stakeParams = {
            staker: '0x0000000000000000000000000000000000000003',
            amount: '1000000000000',
            beneficiary: '0x0000000000000000000000000000000000000004',
            gasPrice: '1',
            gasLimit: '1000000',
            unlockSecret: 'secret',
            facilitator: '0x0000000000000000000000000000000000000005',
            gas: '80000000',
        };
        valueTokenAddress = '0x0000000000000000000000000000000000000006';
        baseTokenAddress = '0x0000000000000000000000000000000000000007';

        hashLockObj = {
            secret: 'secret',
            unlockSecret: '0x736563726574',
            hashLock: '0x65462b0520ef7d3df61b9992ed3bea0c56ead753be7c8b3614e0ce01e4cac41b',
        };

        bountyAmount = '100';
        stakerNonce = '1';
    });

    it('should throw error when staker address is invalid', async function() {
        this.timeout(5000);
        const expectedErrorMessage = 'Invalid staker address.';
        await facilitator
            .stake(
                '0x123',
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                stakeParams.gas,
            )
            .catch((exception) => {
                assert.strictEqual(
                    exception.message,
                    expectedErrorMessage,
                    `Exception reason must be "${expectedErrorMessage}"`,
                );
            });
    });

    it('should throw error when beneficiary address is invalid', async function() {
        this.timeout(5000);
        const expectedErrorMessage = 'Invalid beneficiary address.';
        await facilitator
            .stake(
                stakeParams.staker,
                stakeParams.amount,
                '0x123',
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                stakeParams.gas,
            )
            .catch((exception) => {
                assert.strictEqual(
                    exception.message,
                    expectedErrorMessage,
                    `Exception reason must be "${expectedErrorMessage}"`,
                );
            });
    });

    it('should throw error when stake amount is zero', async function() {
        this.timeout(5000);
        const expectedErrorMessage = 'Stake amount must not be zero.';
        await facilitator
            .stake(
                stakeParams.staker,
                '0',
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                stakeParams.gas,
            )
            .catch((exception) => {
                assert.strictEqual(
                    exception.message,
                    expectedErrorMessage,
                    `Exception reason must be "${expectedErrorMessage}"`,
                );
            });
    });

    it('should pass when gas price is undefined', async function() {
        this.timeout(5000);
        stakeParams.gasPrice = 0;
        setup();

        const result = await facilitator.stake(
            stakeParams.staker,
            stakeParams.amount,
            stakeParams.beneficiary,
            undefined,
            stakeParams.gasLimit,
            stakeParams.unlockSecret,
            stakeParams.facilitator,
            stakeParams.gas,
        );

        // Assert the result/
        assert.strictEqual(result.txResult, true, 'Transaction result must be true.');
        assert.strictEqual(
            result.txOptions.from,
            stakeParams.facilitator,
            'From address of transaction option must be facilitator address',
        );
        assert.strictEqual(
            result.txOptions.to,
            gatewayAddress,
            'To address of transaction option must be gateway contract address',
        );
        assert.strictEqual(
            result.txOptions.gas,
            stakeParams.gas,
            `Gas provided in the transaction option must be ${stakeParams.gas}`,
        );

        // Assert if the mocked functions were called correctly.
        SpyAssert.assert(spyStakeCall, 1, [
            [
                stakeParams.staker,
                stakeParams.amount,
                stakeParams.beneficiary,
                undefined,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                stakeParams.gas,
            ],
        ]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyStake, 1, [
            [stakeParams.amount, stakeParams.beneficiary, '0', stakeParams.gasLimit, stakerNonce, hashLockObj.hashLock],
        ]);

        SpyAssert.assert(spyGetBaseToken, 1, [[]]);
        SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
        SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
        SpyAssert.assert(spyGetBounty, 1, [[]]);
        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeParams.staker, stakeParams.amount, stakeParams.gas]]);
        SpyAssert.assert(spyApproveBountyAmount, 1, [[stakeParams.facilitator, bountyAmount]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spySend, 1, [[]]);

        tearDown();
    });

    it('should pass when gas limit is undefined', async function() {
        this.timeout(5000);
        stakeParams.gasLimit = '0';
        setup();

        const result = await facilitator.stake(
            stakeParams.staker,
            stakeParams.amount,
            stakeParams.beneficiary,
            stakeParams.gasPrice,
            undefined,
            stakeParams.unlockSecret,
            stakeParams.facilitator,
            stakeParams.gas,
        );

        // Assert the result/
        assert.strictEqual(result.txResult, true, 'Transaction result must be true.');
        assert.strictEqual(
            result.txOptions.from,
            stakeParams.facilitator,
            'From address of transaction option must be facilitator address',
        );
        assert.strictEqual(
            result.txOptions.to,
            gatewayAddress,
            'To address of transaction option must be gateway contract address',
        );
        assert.strictEqual(
            result.txOptions.gas,
            stakeParams.gas,
            `Gas provided in the transaction option must be ${stakeParams.gas}`,
        );

        // Assert if the mocked functions were called correctly.
        SpyAssert.assert(spyStakeCall, 1, [
            [
                stakeParams.staker,
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                undefined,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                stakeParams.gas,
            ],
        ]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyStake, 1, [
            [stakeParams.amount, stakeParams.beneficiary, stakeParams.gasPrice, '0', stakerNonce, hashLockObj.hashLock],
        ]);

        SpyAssert.assert(spyGetBaseToken, 1, [[]]);
        SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
        SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
        SpyAssert.assert(spyGetBounty, 1, [[]]);
        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeParams.staker, stakeParams.amount, stakeParams.gas]]);
        SpyAssert.assert(spyApproveBountyAmount, 1, [[stakeParams.facilitator, bountyAmount]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spySend, 1, [[]]);

        tearDown();
    });

    it('should pass when without unlock secret', async function() {
        this.timeout(5000);
        delete stakeParams.unlockSecret;
        setup();

        const result = await facilitator.stake(
            stakeParams.staker,
            stakeParams.amount,
            stakeParams.beneficiary,
            stakeParams.gasPrice,
            stakeParams.gasLimit,
            stakeParams.unlockSecret,
            stakeParams.facilitator,
            stakeParams.gas,
        );

        // Assert the result/
        assert.strictEqual(result.txResult, true, 'Transaction result must be true.');
        assert.strictEqual(
            result.txOptions.from,
            stakeParams.facilitator,
            'From address of transaction option must be facilitator address',
        );
        assert.strictEqual(
            result.txOptions.to,
            gatewayAddress,
            'To address of transaction option must be gateway contract address',
        );
        assert.strictEqual(
            result.txOptions.gas,
            stakeParams.gas,
            `Gas provided in the transaction option must be ${stakeParams.gas}`,
        );

        // Assert if the mocked functions were called correctly.
        SpyAssert.assert(spyStakeCall, 1, [
            [
                stakeParams.staker,
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                undefined,
                stakeParams.facilitator,
                stakeParams.gas,
            ],
        ]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyStake, 1, [
            [
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakerNonce,
                hashLockObj.hashLock,
            ],
        ]);

        SpyAssert.assert(spyGetBaseToken, 1, [[]]);
        SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
        SpyAssert.assert(spyGetHashLock, 1, [[]]);
        SpyAssert.assert(spyGetBounty, 1, [[]]);
        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeParams.staker, stakeParams.amount, stakeParams.gas]]);
        SpyAssert.assert(spyApproveBountyAmount, 1, [[stakeParams.facilitator, bountyAmount]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spySend, 1, [[]]);

        tearDown();
    });

    it('should pass when facilitator address is not provided', async function() {
        this.timeout(5000);
        delete stakeParams.facilitator;
        setup();

        const result = await facilitator.stake(
            stakeParams.staker,
            stakeParams.amount,
            stakeParams.beneficiary,
            stakeParams.gasPrice,
            stakeParams.gasLimit,
            stakeParams.unlockSecret,
            undefined,
            stakeParams.gas,
        );

        // Assert the result/
        assert.strictEqual(result.txResult, true, 'Transaction result must be true.');
        assert.strictEqual(
            result.txOptions.from,
            stakeParams.staker,
            'From address of transaction option must be staker address',
        );
        assert.strictEqual(
            result.txOptions.to,
            gatewayAddress,
            'To address of transaction option must be gateway contract address',
        );
        assert.strictEqual(
            result.txOptions.gas,
            stakeParams.gas,
            `Gas provided in the transaction option must be ${stakeParams.gas}`,
        );

        // Assert if the mocked functions were called correctly.
        SpyAssert.assert(spyStakeCall, 1, [
            [
                stakeParams.staker,
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                undefined,
                stakeParams.gas,
            ],
        ]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyStake, 1, [
            [
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakerNonce,
                hashLockObj.hashLock,
            ],
        ]);

        SpyAssert.assert(spyGetBaseToken, 1, [[]]);
        SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
        SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
        SpyAssert.assert(spyGetBounty, 1, [[]]);
        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeParams.staker, stakeParams.amount, stakeParams.gas]]);
        SpyAssert.assert(spyApproveBountyAmount, 1, [[stakeParams.staker, bountyAmount]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spySend, 1, [[]]);

        tearDown();
    });

    it('should pass when all the function arguments are provided', async function() {
        this.timeout(5000);
        setup();

        const result = await facilitator.stake(
            stakeParams.staker,
            stakeParams.amount,
            stakeParams.beneficiary,
            stakeParams.gasPrice,
            stakeParams.gasLimit,
            stakeParams.unlockSecret,
            stakeParams.facilitator,
            stakeParams.gas,
        );

        // Assert the result/
        assert.strictEqual(result.txResult, true, 'Transaction result must be true.');
        assert.strictEqual(
            result.txOptions.from,
            stakeParams.facilitator,
            'From address of transaction option must be facilitator address',
        );
        assert.strictEqual(
            result.txOptions.to,
            gatewayAddress,
            'To address of transaction option must be gateway contract address',
        );
        assert.strictEqual(
            result.txOptions.gas,
            stakeParams.gas,
            `Gas provided in the transaction option must be ${stakeParams.gas}`,
        );

        // Assert if the mocked functions were called correctly.
        SpyAssert.assert(spyStakeCall, 1, [
            [
                stakeParams.staker,
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                stakeParams.gas,
            ],
        ]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyStake, 1, [
            [
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakerNonce,
                hashLockObj.hashLock,
            ],
        ]);

        SpyAssert.assert(spyGetBaseToken, 1, [[]]);
        SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
        SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
        SpyAssert.assert(spyGetBounty, 1, [[]]);
        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeParams.staker, stakeParams.amount, stakeParams.gas]]);
        SpyAssert.assert(spyApproveBountyAmount, 1, [[stakeParams.facilitator, bountyAmount]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spySend, 1, [[]]);

        tearDown();
    });

    it('should pass when gas is not provided in the function argument', async function() {
        this.timeout(5000);
        delete stakeParams.gas;
        setup();

        const result = await facilitator.stake(
            stakeParams.staker,
            stakeParams.amount,
            stakeParams.beneficiary,
            stakeParams.gasPrice,
            stakeParams.gasLimit,
            stakeParams.unlockSecret,
            stakeParams.facilitator,
            undefined,
        );

        // Assert the result/
        assert.strictEqual(result.txResult, true, 'Transaction result must be true.');
        assert.strictEqual(
            result.txOptions.from,
            stakeParams.facilitator,
            'From address of transaction option must be facilitator address',
        );
        assert.strictEqual(
            result.txOptions.to,
            gatewayAddress,
            'To address of transaction option must be gateway contract address',
        );
        assert.strictEqual(result.txOptions.gas, '7000000', `Gas provided in the transaction option must be 7000000`);

        // Assert if the mocked functions were called correctly.
        SpyAssert.assert(spyStakeCall, 1, [
            [
                stakeParams.staker,
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                undefined,
            ],
        ]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyStake, 1, [
            [
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakerNonce,
                hashLockObj.hashLock,
            ],
        ]);

        SpyAssert.assert(spyGetBaseToken, 1, [[]]);
        SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
        SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
        SpyAssert.assert(spyGetBounty, 1, [[]]);
        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeParams.staker, stakeParams.amount, '7000000']]);
        SpyAssert.assert(spyApproveBountyAmount, 1, [[stakeParams.facilitator, bountyAmount]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spySend, 1, [[]]);

        tearDown();
    });

    it('should pass when base token and value token is same and staker is facilitator', async function() {
        this.timeout(5000);
        stakeParams.facilitator = stakeParams.staker;
        baseTokenAddress = valueTokenAddress;
        setup();

        const result = await facilitator.stake(
            stakeParams.staker,
            stakeParams.amount,
            stakeParams.beneficiary,
            stakeParams.gasPrice,
            stakeParams.gasLimit,
            stakeParams.unlockSecret,
            stakeParams.facilitator,
            stakeParams.gas,
        );

        // Assert the result/
        assert.strictEqual(result.txResult, true, 'Transaction result must be true.');
        assert.strictEqual(
            result.txOptions.from,
            stakeParams.facilitator,
            'From address of transaction option must be facilitator address',
        );
        assert.strictEqual(
            result.txOptions.to,
            gatewayAddress,
            'To address of transaction option must be gateway contract address',
        );
        assert.strictEqual(
            result.txOptions.gas,
            stakeParams.gas,
            `Gas provided in the transaction option must be ${stakeParams.gas}`,
        );

        // Assert if the mocked functions were called correctly.
        SpyAssert.assert(spyStakeCall, 1, [
            [
                stakeParams.staker,
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                stakeParams.gas,
            ],
        ]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyStake, 1, [
            [
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakerNonce,
                hashLockObj.hashLock,
            ],
        ]);

        SpyAssert.assert(spyGetBaseToken, 1, [[]]);
        SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
        SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
        SpyAssert.assert(spyGetBounty, 1, [[]]);
        const totalAmount = new BN(stakeParams.amount).add(new BN(bountyAmount));
        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeParams.staker, totalAmount.toString(10), stakeParams.gas]]);
        SpyAssert.assert(spyApproveBountyAmount, 0, [[]]);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spySend, 1, [[]]);

        tearDown();
    });

    it('should pass when bounty amount is zero', async function() {
        this.timeout(5000);
        bountyAmount = '0';
        setup();

        const result = await facilitator.stake(
            stakeParams.staker,
            stakeParams.amount,
            stakeParams.beneficiary,
            stakeParams.gasPrice,
            stakeParams.gasLimit,
            stakeParams.unlockSecret,
            stakeParams.facilitator,
            stakeParams.gas,
        );

        // Assert the result/
        assert.strictEqual(result.txResult, true, 'Transaction result must be true.');
        assert.strictEqual(
            result.txOptions.from,
            stakeParams.facilitator,
            'From address of transaction option must be facilitator address',
        );
        assert.strictEqual(
            result.txOptions.to,
            gatewayAddress,
            'To address of transaction option must be gateway contract address',
        );
        assert.strictEqual(
            result.txOptions.gas,
            stakeParams.gas,
            `Gas provided in the transaction option must be ${stakeParams.gas}`,
        );

        // Assert if the mocked functions were called correctly.
        SpyAssert.assert(spyStakeCall, 1, [
            [
                stakeParams.staker,
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakeParams.unlockSecret,
                stakeParams.facilitator,
                stakeParams.gas,
            ],
        ]);
        SpyAssert.assert(spyGetValueToken, 1, [[]]);
        SpyAssert.assert(spyStake, 1, [
            [
                stakeParams.amount,
                stakeParams.beneficiary,
                stakeParams.gasPrice,
                stakeParams.gasLimit,
                stakerNonce,
                hashLockObj.hashLock,
            ],
        ]);

        SpyAssert.assert(spyGetBaseToken, 0, [[]]);
        SpyAssert.assert(spyGetGatewayNonce, 1, [[stakeParams.staker]]);
        SpyAssert.assert(spyGetHashLock, 1, [[hashLockObj.secret]]);
        SpyAssert.assert(spyGetBounty, 1, [[]]);
        SpyAssert.assert(spyApproveStakeAmount, 1, [[stakeParams.staker, stakeParams.amount, stakeParams.gas]]);
        SpyAssert.assert(spyApproveBountyAmount, 0);
        SpyAssert.assert(spyGateway, 1, [[gatewayAddress]]);
        SpyAssert.assert(spySend, 1, [[]]);

        tearDown();
    });
});
