"use strict";

const DeployContract = function(params) {
    const oThis = this;

    oThis.web3 = params.web3;
    oThis.contractName = params.contractName;
    oThis.deployerAddress = params.deployerAddress;
    oThis.gasPrice = params.gasPrice;
    oThis.gas = params.gas;
    oThis.args = params.args;

};

DeployContract.prototype = {
    perform: async function() {
        const oThis = this;

        let txOptions = {
            from: oThis.deployerAddress,
            gas: oThis.gas,
            data: oThis._binFileContent(),
            gasPrice: oThis.gasPrice
        };

        if (oThis.args) {
            txOptions.arguments = oThis.args;
        }

        const contract = new oThis.web3.eth.Contract(oThis._abiFileContent(), null, txOptions);

        let tx = contract.deploy(txOptions),
            transactionHash = null,
            receipt = null;

        console.log('Deploying contract ' + oThis.contractName);

        const instance = await tx.send()
            .on('receipt', function(value) {
                receipt = value;
            })
            .on('transactionHash', function(value) {
                console.log('transaction hash: ' + value);
                transactionHash = value;
            })
            .on('error', function(error) {
                return Promise.reject(error);
            });

        // checking if the contract was deployed at all.
        const code = await oThis.web3.eth.getCode(instance.options.address);

        if (code.length <= 2) {
            return Promise.reject('Contract deployment failed. oThis.web3.eth.getCode returned empty code.');
        }

        console.log('Address  : ' + instance.options.address);
        console.log('Gas used : ' + receipt.gasUsed);

        return Promise.resolve({
            receipt: receipt,
            instance: instance
        });
    },

    _abiFileContent: function () {
        const oThis = this;

        return JSON.parse(oThis._read('../../contracts/abi/' + oThis.contractName + '.abi'));
    },

    _binFileContent: function () {
        const oThis = this;

        return '0x' + oThis._read('../../contracts/bin/' + oThis.contractName + '.bin');
    },

    _read: function(filePath) {
        filePath = path.join(__dirname, '/' + filePath);
        console.log('filePath', filePath);
        return fs.readFileSync(filePath, 'utf8');
    }
};

module.exports = DeployContract;
