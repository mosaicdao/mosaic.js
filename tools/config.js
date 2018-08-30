const os = require('os');

module.exports = {
  origin: {
    chainId: 1000,
    networkId: 1000,
    gethFolder: os.homedir() + '/mosaic-setup/origin-geth',
    allocAmount: '1000000000000000000', // in base currency
    gasLimit: 4700000,
    genesisFileTemplatePath: './tools/genesis-origin.json',
    genesisFilePath: os.homedir() + '/mosaic-setup/genesis-origin.json',
    geth: {
      host: '127.0.0.1',
      rpcport: 8545,
      wsport: 8546,
      port: 3010
    }
  },

  auxiliary: {
    chainId: 2000,
    networkId: 2000,
    gethFolder: os.homedir() + '/mosaic-setup/auxiliary-geth',
    allocAmount: '800000000', // in base currency
    gasLimit: 4700000,
    genesisFileTemplatePath: './tools/genesis-auxiliary.json',
    genesisFilePath: os.homedir() + '/mosaic-setup/genesis-auxiliary.json',
    geth: {
      host: '127.0.0.1',
      rpcport: 18545,
      wsport: 18546,
      port: 13010
    }
  }
};
