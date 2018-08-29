module.exports = {
  origin: {
    chainId: 1000,
    gethFolder: '~/mosaic-setup/origin-geth',
    allocAmount: '1000000000000000000', // in base currency
    gasLimit: 4700000,
    genesisFileTemplatePath: './tools/genesis-origin.json',
    genesisFilePath: '~/mosaic-setup/genesis-origin.json'
  },

  auxiliary: {
    chainId: 2000,
    gethFolder: '~/mosaic-setup/auxiliary-geth',
    allocAmount: '800000000', // in base currency
    gasLimit: 4700000,
    genesisFileTemplatePath: './tools/genesis-auxiliary.json',
    genesisFilePath: '~/mosaic-setup/genesis-auxiliary.json'
  }
};
