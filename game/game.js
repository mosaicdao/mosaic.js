const Mosaic = require('index.js');

const mosaicConfig = {
  "origin": {
    "provider": "ws://127.0.0.1:18545"
  },
  "auxiliaries": [
    {
      "provider": "ws://127.0.0.1:19546",
      "originCoreContractAddress": "0x0000000000000000000000000000000000000001"
    }
  ]
};

function Game(originCoreAddress, originWorkers, auxiliaryWorkers) {
  this.mosaic = new Mosaic('', mosaicConfig);
  this.origin = this.mosaic.origin();
  this.auxiliary = this.mosaic.core(originCoreAddress);
  this.core = this.mosaic.contracts.core;
  this.originBlockNumber = 0;
  this.auxiliaryBlockNumber = 0;
  this.originWorkers = originWorkers;
  this.auxiliaryWorkers = auxiliaryWorkers;
}

Game.prototype = {

  run: async function () {

    await this.commitStateRoot();
  },

  commitStateRoot: async function () {

    let originBlock = await this.origin.eth.getBlockNumber('latest');
    let auxiliaryBlock = await this.auxiliary.eth.getBlockNumber('latest');

    if (this.auxiliaryBlockNumber < auxiliaryBlock.blockNumber) {
      // TODO Worker unlocking
      let receipt = await this.core.origin
        .commitStateRoot(auxiliaryBlock.blockNumber, auxiliaryBlock.stateRoot)
        .signAndSend({from: this.originWorkers});

      console.log("auxiliary receipt", receipt);
      this.auxiliaryBlockNumber = auxiliaryBlock.blockNumber;

    }
    if (this.originBlockNumber < originBlock.blockNumber) {
      // TODO Worker unlocking
      let receipt = await this.core.auxiliary
        .commitStateRoot(originBlock.blockNumber, originBlock.stateRoot)
        .signAndSend({from: this.originWorkers});

      console.log("origin receipt", receipt);

      this.originBlockNumber = originBlock.blockNumber;
    }
    console.log("Waiting for new block......");
    setTimeout(commitStateRoot, 10000);
  }
};

new Game().run();
