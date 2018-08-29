'use strict';

const fs = require('fs');

const deployContract = require('../utils/deployContract')
;

/**
 * auxiliaryConfig = {
 *    provider: 'http://...',
 *    deployerAddress: '0x000...',
 *    opsAddress: '0x000...',
 *    workerAddress: '0x000...',
 *    registrar: '0x000...',
 *    chainId: 1000,
 *    chainIdRemote: 2001,
 *    remoteChainBlockGenerationTime: 15,
 *    openSTRemote: '0x000...'
 * }
 *
 */
const InitSTPrime = function(auxiliaryConfig) {
    const oThis = this;

    oThis.auxiliaryConfig = auxiliaryConfig;
};

InitSTPrime.prototype = {

    perform: async function() {
        const oThis = this;

        await oThis.deploySTPrimeOnAuxiliary();
    },

    deploySTPrimeOnAuxiliary: async function() {
        const oThis = this;

        console.log('Deploy STPrime contract on auxiliary chain START.');

        await auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxiliaryConfig.deployerAddress, 'testtest');

        // TODO Verify ST Prime constructor parameters as it's in development
        let auxiliarySTPrimeDeployResponse = await new deployContract({
            web3: oThis.auxiliaryConfig.provider,
            contractName: 'STPrime',
            deployerAddress: oThis.auxiliaryConfig.deployerAddress,
            gasPrice: oThis.gasPrice,
            gas: 4700000,
            args: [valueTokenAddress, chainIdValue, chainIdUtility, conversionRate, conversionRateDecimals]
        }).perform();

        console.log('auxiliarySTPrimeDeployResponse:', auxiliarySTPrimeDeployResponse);
    }
};

module.exports = InitSTPrime;
