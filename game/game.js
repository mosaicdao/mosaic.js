const Mosaic = require('../index.js');

function Game(gameConfig) {
  this.mosaic = new Mosaic('', gameConfig.mosaicConfig);
  this.origin = this.mosaic.origin();
  this.originCoreAddress = gameConfig.origin.core.address;
  this.auxiliary = this.mosaic.core(this.originCoreAddress);


  let CoreContractClass = this.mosaic.contracts.Core;
  this.originBlockNumber = 0;
  this.auxiliaryBlockNumber = 0;
  this.originWorkers = gameConfig.origin.worker;
  this.auxiliaryWorkers = gameConfig.auxiliary.worker;
  this.core = new CoreContractClass(gameConfig.origin.core.address);
  this.setSigner();
}

Game.prototype = {

  setSigner: function() {
    //We will use the geth Signer here.
    let oThis = this,
      mosaic = oThis.mosaic;

    let originGethSigner = new mosaic.utils.GethSignerService(mosaic.origin());
    originGethSigner.addAccount(oThis.originWorkers.address, oThis.originWorkers.passPhrase);

    mosaic.signers.setOriginSignerService(function(transactionData) {
      return originGethSigner.signTransaction(transactionData);
    });

    let auxiliaryGethSigner = new mosaic.utils.GethSignerService(mosaic.core(this.originCoreAddress));
    auxiliaryGethSigner.addAccount(oThis.auxiliaryWorkers.address, oThis.auxiliaryWorkers.passPhrase);

    mosaic.signers.setAuxiliarySignerService(function(transactionData) {
      return auxiliaryGethSigner.signTransaction(transactionData);
    });
  },

  run: async function() {
    await this.commitStateRoot();
  },

  commitStateRoot: async function() {
    const oThis = this;
    let originBlock = await this.origin.eth.getBlock('latest');
    let auxiliaryBlock = await this.auxiliary.eth.getBlock('latest');

    let auxBlockNumber = auxiliaryBlock.number;

    if (this.auxiliaryBlockNumber < auxBlockNumber) {

      await this.core.origin
        .commitStateRoot(auxBlockNumber, auxiliaryBlock.stateRoot)
        .signAndSend({
          from: this.originWorkers.address,
          gasPrice: 1000000,
          gas: 4700000
        }, function (err, response) {
          if (!err) {
            console.log(`Committed state root on origin chain for block ${auxBlockNumber}`);
          }
          else {
            console.log(`Error while committing state root on origin chain for block ${auxBlockNumber}`)
          }
        });

      this.auxiliaryBlockNumber = auxBlockNumber;
    }

    let originBlockNumber = originBlock.number;

    if (this.originBlockNumber < originBlockNumber) {

      await this.core.auxiliary
        .commitStateRoot(originBlockNumber, originBlock.stateRoot)
        .signAndSend({
          from: this.auxiliaryWorkers.address,
          gasPrice: 1000000,
          gas: 4700000
        }, function (err, response) {
          if (!err) {
            console.log(`Committed state root on auxiliary chain for block ${originBlockNumber}`);
          } else {
            console.log(`Error while committing state root on auxiliary chain for block ${auxBlockNumber}`)
          }
        });

      this.originBlockNumber = originBlockNumber;
    }

    console.log('Waiting for new block......');
    setTimeout(function() {
      oThis.commitStateRoot();
    }, 10000);
  }
};


let originCoreAddress = '0xaA8b1fA8cCE482bB5b87827496C79eF37ebb67E1',
  originWorkers = '0xAc56783c6bcf3AeB02A71d8b9DC6443ad7509224',
  auxiliaryWorkers = '0xac67A86B84BbA63De700dDEAA899c2e1E58544AD';


let gameConfig = {

  mosaicConfig: {
    origin: {
      provider: 'ws://127.0.0.1:18545'
    },
    auxiliaries: [
      {
        provider: 'ws://127.0.0.1:19546',
        originCoreContractAddress: originCoreAddress
      }
    ]
  },
  origin: {
    worker: {
      address: originWorkers,
      passPhrase: 'testtest'
    },
    core: {
      address: originCoreAddress
    }
  },

  auxiliary: {
    worker: {
      address: auxiliaryWorkers,
      passPhrase: 'testtest'
    }
  }
};

let game = new Game(gameConfig);

game.core.on('ready', function() {
  game.run();
});
