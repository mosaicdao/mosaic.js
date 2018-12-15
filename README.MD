


# Install Package
```js
npm install mosaic-tbd
//TBD: change require below.
MosaicTbd = require('./index');
```

# Abi Bin Provider Usage
```js
abiBinProvider = new MosaicTbd.AbiBinProvider();
jsonInterface = abiBinProvider.getABI('Organization');
contractBin = abiBinProvider.getBIN('Organization');
```



# Using Setup Script
Please follow these steps in sequence.

## Create setup instance
```js
let originWeb3 = new Web3('http://127.0.0.1:8545');
let auxiliaryWeb3 = new Web3('http://127.0.0.1:8546');
let helper = new ChainSetup(originWeb3, auxiliaryWeb3);
let simpleToken = "0x..."; /* SimpleToken Contract Address deployed on origin chain */
```

## Create configurations. 
Make sure all deployer addresses, organization owner addresses and chainOwner have sufficient gas and are added to web3.eth.accounts.wallet of respective chains.

### Define origin chain setup config
```js
let originConfig = {
    "deployer": "0x...", /* Common Deployer Key Address on origin chain */
    "gasPrice": "0x5B9ACA00", /* Gas Price to use for deployment and setup on origin chain */
    "libs":{ /* Configuration to setup libs. */
      "deployer": "0x..." /* Optional, Deployer Key Address */
    },
    "organization": { /* Configuration to setup organization. */
      "deployer": "0x...", /* Optional, Deployer Key Address */
      "owner": "0x...", /* Organization Key Address */
      "admin": "0x...", /* Organization Admin Key Address */
      "worker": "0x...", /* Organization Worker Key Address */
      "completeOwnershipTransfer": true /* Optional. If set to true shall use Organization Key Address */
    },
    "safeCore": {
      "remoteChainId": "12345", /* Chain Id of Auxiliary Chain*/
      "deployer": "0x...", /* Optional, Deployer Key Address */
      "organizationOwner": "0x...", /* Organization Key Address */
    },
    "gateway": {
      "deployer": "0x...", /* Optional, Deployer Key Address */
      "bounty": "100" /* Facilitator Bounty */
    }
  };
```
### Define auxiliary chain setup config.
```js
let auxConfig = {
    "deployer": "0x...", /* Common Deployer Key Address on auxiliary chain */
    "gasPrice": "0", /* Gas Price to use for deployment and setup on auxiliary chain. Should be zero */
    "libs":{ /* Configuration to setup libs. */
      "deployer": "0x..." /* Optional, Deployer Key Address */
    },
    "organization": { /* Configuration to setup organization. */
      "deployer": "0x...", /* Optional, Deployer Key Address */
      "owner": "0x...", /* Organization Key Address */
      "admin": "0x...", /* Organization Admin Key Address */
      "worker": "0x...", /* Organization Worker Key Address */
      "completeOwnershipTransfer": true /* Optional. If set to true shall use Organization Key Address */
    },
    "safeCore": {
      "remoteChainId": "12345", /* Chain Id of Origin Chain (Ropsten/Mainnet/..) */
      "deployer": "0x...", /* Optional, Deployer Key Address */
      "organizationOwner": "0x...", /* Organization Key Address */
    },
    "ostPrime": {
      "deployer": "0x...", /* Optional, Deployer Key Address */
      "chainOwner": "0x...", /* Chain Owner Address. This key is the only key that shall have exactly 800,000,000 base-currency allocated to it in genesis file.*/
    },
    "cogateway": {
      "deployer": "0x...", /* Optional, Deployer Key Address */
      "bounty": "100" /* Facilitator Bounty */
    }
  };
```
### Executing setup. This may some time.
```js
helper.setup(simpleToken, originConfig, auxiliaryConfig)
.then(function (output) {
  console.log("output", output);
})
```


