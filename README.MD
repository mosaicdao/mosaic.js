


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