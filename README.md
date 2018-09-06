# Developer guide

### Creating the mosaic object
```js
Mosaic = require('mosaic.js');

mosaicConfig = {
 "origin": {
   "provider": "http://127.0.0.1:8545"
 },
 "auxiliaries": [
   {
     "provider": "http://127.0.0.1:9546",
     "originCoreContractAddress": "0x0000000000000000000000000000000000000001"
   }
 ]
};

mosaic = new Mosaic('', mosaicConfig);
```

### Setup
```js
let originConfig = {
	deployerAddress: '0xAA93Fb03664e6768C798720a3aB035F414D7821F',
	opsAddress: '0x5505793aDfbf265972cbBa118d6097D539732b86',
	workerAddress: '0x5505793aDfbf265972cbBa118d6097D539732b86',
	registrar: '0x36796be23fE925cf18f8710249B36B1e53557836',
	chainId: 2001,
	chainIdRemote: 1000,
	remoteChainBlockGenerationTime: 15,
	openSTRemote: '0x7aA8D26B1153486FB62fB674971E30Fbafac5702'
};

let auxliaryConfig = {
	deployerAddress: '0x3A4459ED4d44103E82F3be9794ab7B4F8d2e3c75',
	opsAddress: '0xbF82DaE8f9B6b85471D26C27F63c05D978ee8B67',
	workerAddress: '0xbF82DaE8f9B6b85471D26C27F63c05D978ee8B67',
	registrar: '0x2a4ecEDBE6C732C55a3549291c601cfd2Ba1D0a5',
	chainId: 1000,
	chainIdRemote: 2001,
	remoteChainBlockGenerationTime: 15,
	openSTRemote: '0x7aA8D26B1153486FB62fB674971E30Fbafac5702'
};

// setting up the cores
mosaic.setup.initCore(originConfig, auxliaryConfig).then(console.log);

// deploying message bus
mosaic.setup.initMessageBus(originConfig, auxliaryConfig).then(console.log);
```

###Run the sampe scripts
Please note that this will be updated

Enviornment setup on local machine
```
npm run init-dev-env
npm run init-chains ./mosaic-setup/config.json 
```


###Stake and Mint


```javascript


let fs = require('fs');
let configPath = 'mosaic-setup/config.json'
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
let getMosaicConfig = function(configs) {
    return {
        origin: {
            provider: configs.originGethRpcEndPoint
        },
        auxiliaries: [
            {
                provider: configs.auxiliaryGethRpcEndPoint,
                originCoreContractAddress: configs.originCoreContractAddress
            }
        ]
    };
}

let Mosaic = require('./index');
let mosiacConfig = getMosaicConfig(config);
let mosaic = new Mosaic('', mosiacConfig);


let originGethSigner = new mosaic.utils.GethSignerService(mosaic.origin());
    
originGethSigner.addAccount(config.originDeployerAddress, 'testtest');
originGethSigner.addAccount(config.auxiliaryWorkerAddress, 'testtest');
mosaic.signers.setOriginSignerService(originGethSigner);


stakeAndMint =  new mosaic.contracts.StakeAndMint(config)
stakeAndMint.perform();
```