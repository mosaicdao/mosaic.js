Mosaic = require('../index.js');

mosaicConfig = {
  origin: {
    provider: 'http://127.0.0.1:8545'
  },
  auxiliaries: [
    {
      provider: 'http://127.0.0.1:9546',
      originCoreContractAddress: '0x0000000000000000000000000000000000000001'
    }
  ]
};

mosaic = new Mosaic('', mosaicConfig);

let originConfig = {
  deployerAddress: '0x7fF1AF236e91488aA4981D182DA83169E04E9537',
  opsAddress: '0xaC340842B990F089fE3E0436F0ec6B6820D24314',
  workerAddress: '',
  registrar: '',
  chainId: 2001,
  chainIdRemote: 2000,
  remoteChainBlockGenerationTime: 15,
  openSTRemote: ''
};

let auxliaryConfig = {
  deployerAddress: '0x3480ce2933B2aC6bF95E7fb92a55130D352c502B',
  opsAddress: '0x03F94575645a24F22AF4a24ce1dD683276638B2d',
  workerAddress: '',
  registrar: '',
  chainId: 2000,
  chainIdRemote: 2001,
  remoteChainBlockGenerationTime: 15,
  openSTRemote: ''
};

/*
originConfig: {
    coreAddress: coreAddress,
        deployerAddress: deployerAddress,
        gasPrice: gasPrice,
        token: valueTokenAddress,
        bounty: 100,
        organisationAddress: organisationAddress,
        messageBusAddress: messageBusAddress
},

auxiliaryConfig: {
    coreAddress: coreAddress,
        deployerAddress: deployerAddress,
        gasPrice: gasPrice,
        token: utilityTokenAddress,
        bounty: 100,
        organisationAddress: organisationAddress,
        messageBusAddress: messageBusAddress
}

*/

let deploy = async function() {
  // setting up the cores
  await mosaic.setup.initCore(originConfig, auxliaryConfig).then(console.log);

  /*    let messageBusAddress = await  mosaic.setup.initMessageBus(originConfig, auxliaryConfig);
    originConfig["messageBusAddress"] = messageBusAddress.origin;
    auxliaryConfig["messageBusAddress"] = messageBusAddress.auxiliary;
    console.log("messageBusAddress: ",messageBusAddress);
    */
};

console.log(messageBusAddress);
