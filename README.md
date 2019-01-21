# Developer guide

### Run the sample scripts

Enviornment setup on local machine
```
//checkout the code on the local machine
npm install
npm run init-dev-env
npm run init-chains ./mosaic-setup/config.json 
```

### Create mosiac object
```javascript
let fs = require('fs');
let configPath = 'mosaic-setup/config.json'
let config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
let mosiacConfig = {
            origin: {
                provider: config.originGethRpcEndPoint
            },
            auxiliaries: [
                {
                    provider: config.auxiliaryGethRpcEndPoint,
                    originCoreContractAddress: config.originCoreContractAddress
                }
            ]
        };

let Mosaic = require('./index');
let mosaic = new Mosaic('', mosiacConfig);
```
### Add signers

```javascript
let originGethSigner = new mosaic.utils.GethSignerService(mosaic.origin());
originGethSigner.addAccount(config.originDeployerAddress, 'testtest');
mosaic.signers.setOriginSignerService(originGethSigner);

//let auxiliaryGethSigner = new mosaic.utils.GethSignerService(mosaic.auxiliary());
//auxiliaryGethSigner.addAccount(config.auxiliaryWorkerAddress, 'testtest');
//mosaic.signers.setAuxiliarySignerService(auxiliaryGethSigner)

```
### Stake and Mint

```javascript
let stakeAndMint =  new mosaic.contracts.StakeAndMint(config)
stakeAndMint.perform();

```