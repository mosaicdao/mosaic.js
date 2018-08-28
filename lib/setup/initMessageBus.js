'use strict';

const fs = require('fs');

const InstanceComposer = require('../../instance_composer');

function read(filePath) {
  filePath = path.join(__dirname, '/' + filePath);
  console.log('filePath', filePath);
  return fs.readFileSync(filePath, 'utf8');
}

const deployContract = async function(web3, contractName, deployerAddress, gasPrice, args) {
  let abi = JSON.parse(read('../../contracts/abi/' + contractName + '.abi')),
    binCode = read('../../contracts/bin/' + contractName + '.bin');

  let txOptions = {
    from: deployerAddress,
    gas: 9000000,
    data: '0x' + binCode,
    gasPrice: gasPrice // taken from http://ethgasstation.info/ ---- 1 gwei
  };

  if (args) {
    txOptions.arguments = args;
  }

  const contract = new web3.eth.Contract(abi, null, txOptions);

  let tx = contract.deploy(txOptions),
    transactionHash = null,
    receipt = null;

  console.log('Deploying contract ' + contractName);

  const instance = await tx
    .send()
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

  const code = await web3.eth.getCode(instance.options.address);

  if (code.length <= 2) {
    return Promise.reject('Contract deployment failed. web3.eth.getCode returned empty code.');
  }

  console.log('Address  : ' + instance.options.address);
  console.log('Gas used : ' + receipt.gasUsed);

  return Promise.resolve({
    receipt: receipt,
    instance: instance
  });
};

/**
 * originConfig = {
 *    provider: 'http://...',
 *    deployerAddress: '0xBAF68AC8e5966489B2b4139f07dE8188d8Ff5a99',
 *    opsAddress: '0xDCcfDAFF7aDDd20e5C64a3FE4b0B0668751EF194',
 *    workerAddress: '0x000...',
 *    registrar: '0x000...',
 *    chainId: 2001,
 *    chainIdRemote: 1000,
 *    remoteChainBlockGenerationTime: 15,
 *    openSTRemote: '0x000...'
 * }
 * auxliaryConfig = {
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
const InitMessageBus = function(originConfig, auxliaryConfig) {
  const oThis = this;

  oThis.originConfig = originConfig;
  oThis.auxliaryConfig = auxliaryConfig;
};

InitMessageBus.prototype = {
  perform: async function() {
    const oThis = this;

    let messageBusOriginAddress = await oThis.deployMessageBusOnOrigin();

    let messageBusAuxiliaryAddress = await oThis.deployMessageBusOnAuxiliary();

    return { origin: messageBusOriginAddress, auxiliary: messageBusAuxiliaryAddress };
  },

  deployMessageBusOnOrigin: async function() {
    const oThis = this;

    let valueWeb3 = new (oThis.ic().OriginWeb3())();

    console.log('Deploy messageBus library on origin chain START.');

    await valueWeb3.eth.personal.unlockAccount(oThis.originConfig.deployerAddress, 'testtest');

    let valueMessageBusLibraryDeployResponse = await deployContract(
      valueWeb3,
      'MessageBus',
      oThis.originConfig.deployerAddress,
      oThis.gasPrice,
      []
    );

    console.log('valueMessageBusLibraryAddress:', valueMessageBusLibraryDeployResponse.receipt.contractAddress);
    return valueMessageBusLibraryDeployResponse.receipt.contractAddress;
  },

  deployMessageBusOnAuxiliary: async function() {
    const oThis = this;

    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())('0x0000000000000000000000000000000000000001');

    console.log('Deploy messageBus library on auxiliary chain START.');

    await auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxliaryConfig.deployerAddress, 'testtest');

    let auxiliaryMessageBusLibraryDeployResponse = await deployContract(
      auxiliaryWeb3,
      'MessageBus',
      oThis.auxliaryConfig.deployerAddress,
      oThis.gasPrice,
      []
    );

    console.log('auxiliaryMessageBusLibraryAddress:', auxiliaryMessageBusLibraryDeployResponse.receipt.contractAddress);
    return auxiliaryMessageBusLibraryDeployResponse.receipt.contractAddress;
  }
};

InstanceComposer.registerShadowableClass(InitMessageBus, 'InitMessageBus');

module.exports = InitMessageBus;
