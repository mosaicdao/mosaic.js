module.exports = {
  origin: {
    chainId: 1000,
    gethFolder: '~/mosaic-setup/origin-geth',
    allocAmount: '1000000000000000000', // in base currency
    gasLimit: 4700000,
    genesisFilePath: '~/mosaic-setup/origin-geth/genesis-origin.json'
  },

  auxiliary: {
    chainId: 2000,
    gethFolder: '~/mosaic-setup/auxiliary-geth',
    allocAmount: '800000000', // in base currency
    gasLimit: 9000000,
    genesisFilePath: '~/mosaic-setup/auxiliary-geth/genesis-auxiliary.json'
  }
};
