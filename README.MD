


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
let auxWeb3 = new Web3('http://127.0.0.1:8546');

let originConfig = {};
let auxConfig = {};

let chainSetup = new MosaicTbd.ChainSetup(originWeb3, originConfig, auxWeb3, auxConfig);
```

## Setup Organization Contract on Origin
### Deploy Organization
```js

```