const Mosaic = require('../index.js');

let orignCoreAddress = "0xaA8b1fA8cCE482bB5b87827496C79eF37ebb67E1"
  , originWorkers = "0xAc56783c6bcf3AeB02A71d8b9DC6443ad7509224"
  , auxiliaryWorkers = "0xac67A86B84BbA63De700dDEAA899c2e1E58544AD"
;


let mosaicConfig = {
  "origin": {
    "provider": "ws://127.0.0.1:18545"
  },
  "auxiliaries": [
    {
      "provider": "ws://127.0.0.1:19546",
      "originCoreContractAddress": orignCoreAddress
    }
  ]
};

//auxiliary core = 0xddfda4B769b2d441B3293AcC622e0188f8438b58
//origin core = 0xc7E63260727F44b4Ab8171a1B5F313A78BD68957

function Game(originCoreAddress, originWorkers, auxiliaryWorkers) {
  this.mosaic = new Mosaic('', mosaicConfig);
  this.origin = this.mosaic.origin();
  this.auxiliary = this.mosaic.core(originCoreAddress);

  let CoreContractClass = this.mosaic.contracts.Core;
  this.originBlockNumber = 0;
  this.auxiliaryBlockNumber = 0;
  this.originWorkers = originWorkers;
  this.auxiliaryWorkers = auxiliaryWorkers;
  this.core = new CoreContractClass(orignCoreAddress)
  this.setSigner();
}

Game.prototype = {

  setSigner: function () {
    //We will use the geth Signer here.
    let oThis  = this,
        mosaic = this.mosaic
    ;

    let originGethSigner = new mosaic.utils.GethSignerService( mosaic.origin() );
    originGethSigner.addAccount(originWorkers, 'testtest');
    mosaic.signers.setOriginSignerService( function ( transactionData ) {
      return originGethSigner.signTransaction( transactionData );
    });

    let auxiliaryGethSigner = new mosaic.utils.GethSignerService( mosaic.core(orignCoreAddress) );
    auxiliaryGethSigner.addAccount(auxiliaryWorkers, 'testtest');
    mosaic.signers.setAuxiliarySignerService( function ( transactionData ) {
      return auxiliaryGethSigner.signTransaction( transactionData );
    });

  },

  run: async function () {

    await this.commitStateRoot();
  },

  commitStateRoot: async function () {
    const oThis = this;
    let originBlock = await this.origin.eth.getBlock('latest');
    let auxiliaryBlock = await this.auxiliary.eth.getBlock('latest');


    console.log("Should Commit aux stateRoot?",(this.auxiliaryBlockNumber < auxiliaryBlock.blockNumber),this.auxiliaryBlockNumber, auxiliaryBlock.blockNumber);
    if (this.auxiliaryBlockNumber < auxiliaryBlock.blockNumber) {
      // TODO Worker unlocking
      console.log("Updating origin core contract");
      let receipt = await this.core.origin
        .commitStateRoot(auxiliaryBlock.blockNumber, auxiliaryBlock.stateRoot)
        .signAndSend({from: this.originWorkers}, function ( err, response) {
          console.log("signAndSend callback triggered." );
          console.log("err", err);
          console.log("response", response);
        });

      console.log("auxiliary receipt", receipt);
      this.auxiliaryBlockNumber = auxiliaryBlock.blockNumber;

    }
    console.log("Should commit origin state root?", (this.originBlockNumber < originBlock.blockNumber), this.originBlockNumber , originBlock.blockNumber);
    if (this.originBlockNumber < originBlock.blockNumber) {
      // TODO Worker unlocking
      let receipt = await this.core.auxiliary
        .commitStateRoot(originBlock.blockNumber, originBlock.stateRoot)
        .signAndSend({from: this.originWorkers}, function ( err, response) {
          console.log("signAndSend callback triggered." );
          console.log("err", err);
          console.log("response", response);
        });

      console.log("origin receipt", receipt);

      this.originBlockNumber = originBlock.blockNumber;
    }
    console.log("Waiting for new block......");
    setTimeout(function () {
      oThis.commitStateRoot();
    }, 10000);
  }
};

let game = new Game(orignCoreAddress, originWorkers, auxiliaryWorkers);
game.core.on('ready', function () {
  game.run();
});
