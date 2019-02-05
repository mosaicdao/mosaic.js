


# Using facilitator
#### Install Package.
```js
npm install @openstfoundation/mosaic.js
```

#### Creating a mosaic object.
```js
const Web3 = require('web3');
const Mosaic = require('@openstfoundation/mosaic.js');

const originContractAddresses = {
  Anchor: '0x0000000000000000000anchorcontractaddress',
  EIP20Gateway: '0x0000000000000eip20gatewaycontractaddress',
};

const auxiliaryContractAddresses = {
  OSTPrime: '0x00000000000000000ostprimecontractaddress',
  Anchor: '0x0000000000000000000anchorcontractaddress',
  EIP20CoGateway: '0x00000000000eip20cogatewaycontractaddress',
};

const originWeb3 = new Web3('http://localhost:8546');
const originChain = new Mosaic.Chain(originWeb3, originContractAddresses);

const auxiliaryWeb3 = new Web3('http://localhost:8547');
const auxiliaryChain = new Mosaic.Chain(auxiliaryWeb3, auxiliaryContractAddresses);

const mosaic = new Mosaic(originChain, auxiliaryChain);
```
#### Creating a facilitator object.
```js
const facilitator = new Mosaic.Facilitator(mosaic);
```

#### Stake using facilitator.
```js
const staker = '0x00000000000000000000stakeraccountaddress';
const amount = '1000000000'; // Stake amount.
const beneficiary = '0x000000000000000beneficiaryaccountaddress';
const gasPrice = '1';
const gasLimit = '1000000000';
const hashlock = '0x00000000000000000000000000000000000000000000000000000000hashlock';
const txOptions = {
  from: staker,
  gas: '7500000',
};

facilitator.stake(
    staker,
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    hashLock,
    txOptions,
  )
  .then(console.log)
  .catch(console.log);
```

#### Progress stake using facilitator.
```js
const unlockSecret = '0x0000000000000000000000000000000000000000000000000000unlocksecret';
const txOptionOrigin = {
  from: '0x0000000000000000originfacilitatoraddress',
  gas: '7500000',
};
const txOptionAuxiliary = {
  from: '0x0000000000000auxiliaryfacilitatoraddress',
  gas: '7500000',
};

facilitator
  .progressStake(
    staker,
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    nonce,
    hashLock,
    unlockSecret,
    txOptionOrigin,
    txOptionAuxiliary,
  )
  .then(console.log)
  .catch(console.log);
```

#### Redeem using facilitator.
```javascript
const redeemer = '0x0000000000000000000000000redeemeraddress';
const redeemAmount = '10000';
const beneficiary = '0x000000000000000beneficiaryaccountaddress';
const gasPrice = '1';
const gasLimit = '10000000';
const hashLock = '00000000000000000000000000000000000000000000000000000000hashlock';
const txOptionRedeem = {
  from: redeemer,
  gas: '7500000',
  value: '100', // This is equal to bounty amount
};

facilitator.redeem(
    redeemAmount,
    beneficiary,
    gasPrice,
    gasLimit,
    hashLock,
    txOptionRedeem,
  )
  .then(console.log)
  .catch(console.log);
```

#### Progres redeem using facilitator.
```javascript
const unlockSecret = '0x0000000000000000000000000000000000000000000000000000unlocksecret';
const txOptionOriginRedeem = {
  from: '0x000000000facilitatoraddressonoriginchain',
  gas: '7500000',
};
const txOptionAuxiliaryRedeem = {
  from: '0x000000facilitatoraddressonauxiliarychain',
  gas: '7500000',
};

facilitator
  .progressRedeem(
    redeemer,
    nonce,
    beneficiary,
    redeemAmount,
    gasPrice,
    gasLimit,
    hashLock,
    unlockSecret,
    txOptionOriginRedeem,
    txOptionAuxiliaryRedeem,
  )
  .then(console.log)
  .catch(console.log);
```
