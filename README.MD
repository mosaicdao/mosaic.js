


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
  gasPrice: '0x5B9ACA00',
  tokenOrganization: {
    "deployer": "0x...", /* Address of key that will deploy the contract */
    owner: "0x...", /* Address of owner key of Organization */
    admin: "0x...", /* Address of admin key of Organization */
    workers: ["0x..."] /* Address for Organized Workers */
  },
  anchorOrganization: {
    "deployer": "0x...", /* Address of key that will deploy the contract */
    owner: "0x...", /* Address of owner key of Organization */
    admin: "0x...", /* Address of admin key of Organization */
    workers: ["0x..."] /* Address for Organized Workers */
  },
  libs: {
    "deployer": "0x...",
  },
  anchor: {
    remoteChainId: '12345',
    "deployer": "0x...", /* Address of key that will deploy the contract */
    "organizationOwner": "0x..." /* Address of owner/admin key of Organization */
  },
  gateway: {
    "deployer": "0x...",
    "bounty": '1000000000000000000'
  }
};
```
### Define auxiliary chain setup config.
```js
let auxiliaryConfig = {
  gasPrice: '0',
  tokenOrganization: {
    "deployer": "0x...", /* Address of key that will deploy the contract */
    owner: "0x...", /* Address of owner key of Organization */
    admin: "0x...", /* Address of admin key of Organization */
    workers: ["0x..."] /* Address for Organized Workers */
  },
  ostPrime: {
    "deployer": "0x...", /* Address of key that will deploy the contract */
    chainOwner: config.chainOwner
  },
  anchorOrganization: {
    "deployer": "0x...", /* Address of key that will deploy the contract */
    owner: "0x...", /* Address of owner key of Organization */
    admin: "0x...", /* Address of admin key of Organization */
    workers: ["0x..."] /* Address for Organized Workers */
  },
  anchor: {
    remoteChainId: '12345', /* Origin chain-id */
    "deployer": "0x...", /* Address of key that will deploy the contract */
    organizationOwner: "0x..." /* Address of owner/admin key of Organization */
  },
  libs: {
    "deployer": "0x...", /* Address of key that will deploy the contract */
  },
  cogateway: {
    "deployer": "0x...", /* Address of key that will deploy the contract */
    "bounty": '1000000000000000000'
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


