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
const InitCore = function(originConfig, auxliaryConfig) {
  const oThis = this;

  oThis.originConfig = originConfig;
  oThis.auxliaryConfig = auxliaryConfig;

  oThis.valueWorkerContractAddress = null;
  oThis.auxiliaryWorkerContractAddress = null;
};

InitCore.prototype = {
  perform: async function() {
    const oThis = this;
    let valueWeb3 = new (oThis.ic().OriginWeb3())();
    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())('0x0000000000000000000000000000000000000001');

    await oThis.deployWorkerOnAuxiliary();

    let auxiliaryCoreContract = await oThis.deployCoreOnAuxiliary();

    await oThis.deployWorkerOnOrigin();

    let originCoreContract = await oThis.deployCoreOnOrigin();

    await oThis.setCoCoreAddress(
      auxiliaryCoreContract.instance,
      originCoreContract.receipt.contractAddress,
      oThis.auxliaryConfig.opsAddress,
      'testtest',
      auxiliaryWeb3
    );
    await oThis.setCoCoreAddress(
      originCoreContract.instance,
      auxiliaryCoreContract.receipt.contractAddress,
      oThis.originConfig.opsAddress,
      'testtest',
      valueWeb3
    );
  },

  deployWorkerOnOrigin: async function() {
    const oThis = this;

    let valueWeb3 = new (oThis.ic().OriginWeb3())();

    console.log('Deploy worker contract on origin chain START.');

    await valueWeb3.eth.personal.unlockAccount(oThis.originConfig.deployerAddress, 'testtest');

    let valueWorkerContractDeployResponse = await deployContract(
      valueWeb3,
      'Workers',
      oThis.originConfig.deployerAddress,
      oThis.gasPrice,
      [oThis.originConfig.token]
    );

    console.log('valueWorkerContractDeployResponse:', valueWorkerContractDeployResponse);

    let valueWorkerContract = valueWorkerContractDeployResponse.instance;

    oThis.valueWorkerContractAddress = valueWorkerContractDeployResponse.receipt.contractAddress;

    console.log('setOpsAddress on value chain Workers START.');

    let setOpsAddressForValueWorkersResponse = await valueWorkerContract.methods
      .setOpsAddress(oThis.originConfig.opsAddress)
      .send({
        from: oThis.originConfig.deployerAddress,
        gasPrice: oThis.gasPrice
      });

    console.log(
      'setOpsAddress on value chain Workers receipt:',
      JSON.stringify(setOpsAddressForValueWorkersResponse, null, 4)
    );

    await valueWeb3.eth.personal.unlockAccount(oThis.originConfig.opsAddress, 'testtest');

    console.log('setWorker on value chain Workers START.');

    let setWorkerForValueWorkersResponse = await valueWorkerContract.methods
      .setWorker(oThis.originConfig.workerAddress, '10000000000000000000000000000000000')
      .send({
        from: oThis.originConfig.opsAddress,
        gasPrice: oThis.gasPrice
      });

    console.log('setWorker on value chain Workers receipt:', JSON.stringify(setWorkerForValueWorkersResponse, null, 4));
  },

  deployCoreOnOrigin: async function () {
    const oThis = this;

    let valueWeb3 = new (oThis.ic().OriginWeb3())();


    let latestBlock = await valueWeb3.eth.getBlock('latest');

    let blockHeight = latestBlock.number,
      stateRoot = latestBlock.stateRoot;

    console.log('Deploy core contract on origin chain START.');

    await valueWeb3.eth.personal.unlockAccount(oThis.originConfig.deployerAddress, 'testtest');

    let coreDeployParams = [
      oThis.originConfig.chainId,
      oThis.originConfig.chainIdRemote,
      blockHeight,
      stateRoot,
      oThis.valueWorkerContractAddress
    ];

    let valueCoreDeployResponse = await deployContract(
      valueWeb3,
      'Core',
      oThis.originConfig.deployerAddress,
      oThis.gasPrice,
      coreDeployParams
    );

    console.log('valueCoreDeployResponse:', valueCoreDeployResponse);

    return valueCoreDeployResponse;
  },

  deployWorkerOnAuxiliary: async function() {
    const oThis = this;

    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())('0x0000000000000000000000000000000000000001');

    console.log('Deploy worker contract on auxiliary chain START.');

    await auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxliaryConfig.deployerAddress, 'testtest');

    let auxiliaryWorkerContractDeployResponse = await deployContract(
      auxiliaryWeb3,
      'Workers',
      oThis.auxliaryConfig.deployerAddress,
      oThis.gasPrice,
      [oThis.auxliaryConfig.token]
    );

    console.log('auxiliaryWorkerContractDeployResponse:', auxiliaryWorkerContractDeployResponse);

    let auxiliaryWorkerContract = auxiliaryWorkerContractDeployResponse.instance;

    oThis.auxiliaryWorkerContractAddress = auxiliaryWorkerContractDeployResponse.receipt.contractAddress;

    console.log('setOpsAddress on auxiliary chain Workers START.');

    let setOpsAddressForAuxiliaryWorkersResponse = await auxiliaryWorkerContract.methods
      .setOpsAddress(oThis.auxliaryConfig.opsAddress)
      .send({
        from: oThis.auxliaryConfig.deployerAddress,
        gasPrice: oThis.gasPrice
      });

    console.log(
      'setOpsAddress on auxiliary chain Workers receipt:',
      JSON.stringify(setOpsAddressForAuxiliaryWorkersResponse, null, 4)
    );

    await auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxliaryConfig.opsAddress, 'testtest');

    console.log('setWorker on auxiliary chain Workers START.');

    let setWorkerForAuxiliaryWorkersResponse = await auxiliaryWorkerContract.methods
      .setWorker(oThis.auxliaryConfig.workerAddress, '10000000000000000000000000000000000')
      .send({
        from: oThis.auxliaryConfig.opsAddress,
        gasPrice: oThis.gasPrice
      });

    console.log(
      'setWorker on auxiliary chain Workers receipt:',
      JSON.stringify(setWorkerForAuxiliaryWorkersResponse, null, 4)
    );
  },

  deployCoreOnAuxiliary: async function() {
    const oThis = this;

    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())('0x0000000000000000000000000000000000000001');

    let latestBlock = await auxiliaryWeb3.eth.getBlock('latest');

    let blockHeight = latestBlock.number,
      stateRoot = latestBlock.stateRoot;

    console.log('Deploy core contract on auxiliary chain START.');

    await auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxliaryConfig.deployerAddress, 'testtest');

    let coreDeployParams = [
      oThis.auxliaryConfig.chainId,
      oThis.auxliaryConfig.chainIdRemote,
      blockHeight,
      stateRoot,
      oThis.auxiliaryWorkerContractAddress
    ];

    let auxiliaryCoreDeployResponse = await deployContract(
      auxiliaryWeb3,
      'Core',
      oThis.auxliaryConfig.deployerAddress,
      oThis.gasPrice,
      coreDeployParams
    );

    console.log('auxiliaryCoreDeployResponse:', auxiliaryCoreDeployResponse);

    let auxiliaryCoreContract = auxiliaryCoreDeployResponse.instance,
      auxiliaryCoreContractAddress = auxiliaryCoreDeployResponse.receipt.contractAddress;

    console.log('auxiliaryCoreContractAddress', auxiliaryCoreContractAddress);

    return auxiliaryCoreDeployResponse;
  },

  setCoCoreAddress: async function (coreInstance, coCoreAddress, workerAddress, passPhrase, web3) {

    let oThis = this;
    console.log("setting co-core address ", coCoreAddress);
    await web3.eth.personal.unlockAccount(workerAddress, passPhrase);

    await coreInstance.methods
      .setCoCoreAddress(coCoreAddress)
      .send({
        from: workerAddress,
        gasPrice: oThis.gasPrice
      });
  }
};

InstanceComposer.registerShadowableClass(InitCore, 'InitCore');

module.exports = InitCore;
