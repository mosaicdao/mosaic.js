# 💠 mosaic.js

![Build master](https://img.shields.io/travis/OpenSTFoundation/mosaic.js/master.svg?label=build%20master&style=flat)
![Build develop](https://img.shields.io/travis/OpenSTFoundation/mosaic.js/develop.svg?label=build%20develop&style=flat)
![npm version](https://img.shields.io/npm/v/@openstfoundation/mosaic.js.svg?style=flat)
[![Discuss on Discourse](https://img.shields.io/discourse/https/discuss.openst.org/topics.svg?style=flat)][discourse]
[![Chat on Gitter](https://img.shields.io/gitter/room/OpenSTFoundation/SimpleToken.svg?style=flat)][gitter]

Mosaic is a parallelization schema for decentralized applications.
It composes heterogeneous blockchain systems into one another.
Decentralized applications can use Mosaic to compute over a composed network of multiple blockchain systems in parallel.

Mosaic enables building scalable blockchain token economies through the bidirectional transposition of ERC20 tokens on one blockchain, the *origin* chain, and a utility token representation on another blockchain, the *auxiliary* chain.

The protocol defines a set of actions that together perform atomic token transfers across two blockchains using gateway contracts. A gateway for a given EIP20 token is comprised of a `EIP20Gateway` contract on origin, a corresponding `EIP20CoGateway` contract on auxiliary, and and an ERC20 utility token contract on auxiliary that mints and burns utility tokens to atomically mirror tokens staked and unstaked on the origin chain.

Atomicity is achieved using a 2-phase message passing architecture between the chains. Messages are declared on the source chain, and confirmed on the target chain with Patricia Merkle proofs once the source chain is finalized. Once messages are confirmed on the target chain, they can efficiently progressed with a hashlock.
Messages can also be reverted if they are not yet completed on the target chain.

You can read [the draft of the mosaic whitepaper][mosaic whitepaper] or [the original OpenST whitepaper][openst whitepaper].

## Instructions

### Installation

```bash
npm install @openstfoundation/mosaic.js web3 web3-eth-accounts
```
> ℹ️ Note that `web3` and `web3-eth-accounts` are peer-dependencies.

### Usage

#### Mosaic

```js
const Web3 = require('web3');
const Mosaic = require('@openstfoundation/mosaic.js');

const originWeb3 = new Web3('http://localhost:8546');
const auxiliaryWeb3 = new Web3('http://localhost:8547');

const originContractAddresses = {
  EIP20Gateway: '0x0000000000000eip20gatewaycontractaddress',
  ...,
};
const auxiliaryContractAddresses = {
  EIP20CoGateway: '0x00000000000eip20cogatewaycontractaddress',
  ...,
};

const originChain = new Mosaic.Chain(originWeb3, originContractAddresses);
const auxiliaryChain = new Mosaic.Chain(auxiliaryWeb3, auxiliaryContractAddresses);

const mosaic = new Mosaic(originChain, auxiliaryChain);
```

#### Facilitator

Creating a new facilitator:
```js
const facilitator = new Mosaic.Facilitator(mosaic);
```

Staking:
```js
const staker = '0x00000000000000000000stakeraccountaddress';
const amount = '1000000000';
const beneficiary = '0x000000000000000beneficiaryaccountaddress';
const gasPrice = '1';
const gasLimit = '1000000000';
const hashLock = '0x00000000000000000000000000000000000000000000000000000000hashlock';
const txOptions = { from: staker };

facilitator
  .stake(
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

Progressing the stake after the state root has been transferred:
```js
const unlockSecret = '0x0000000000000000000000000000000000000000000000000000unlocksecret';
const txOptionOrigin = { from: '0x0000000000000000originfacilitatoraddress' };
const txOptionAuxiliary = { from: '0x0000000000000auxiliaryfacilitatoraddress' };

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

Redeeming:
```js
const redeemer = '0x0000000000000000000000000redeemeraddress';
const redeemAmount = '10000';
const beneficiary = '0x000000000000000beneficiaryaccountaddress';
const gasPrice = '1';
const gasLimit = '10000000';
const hashLock = '00000000000000000000000000000000000000000000000000000000hashlock';
const txOptionRedeem = {
  from: redeemer,
  value: '100', // This must be equal to the bounty amount!
};

facilitator
  .redeem(
    redeemer,
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

Progressing the redemption after the state root has been transferred:
```js
const unlockSecret = '0x0000000000000000000000000000000000000000000000000000unlocksecret';
const txOptionOriginRedeem = { from: '0x000000000facilitatoraddressonoriginchain' };
const txOptionAuxiliaryRedeem = { from: '0x000000facilitatoraddressonauxiliarychain' };

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

#### Deploying Gateways

Using `mosaic.js` to deploy gateways is still a work in progress and must be done manually for now:
```js
// Expecting Mosaic import and an instance of `mosaic`:
const { EIP20Gateway } = Mosaic.Contracts;

EIP20Gateway
  .setup(
    mosaic.origin.web3,
    mosaic.auxiliary.web3,
    gatewayConfig,
    coGatewayConfig,
    originTxOptions,
    auxiliaryTxOptions,
  )
  .then(console.log)
  .catch(console.log);
```

> ⚠️ Note that deployment will be simplified in the future.

## Related Work

[mosaic-contracts] provides the EVM smart contracts implementations.
You can use [mosaic-contracts] directly to deploy a new mosaic chain.

## Contributing

### Set-up

```bash
git clone git@github.com:OpenSTFoundation/mosaic.js.git
cd mosaic.js
npm install
npm run test

# Requires docker:
npm run test:integration
```

### Guidelines

There are multiple ways to contribute to this project. However, before contributing, please first review the [Code of Conduct].

We track our [issues] on GitHub.

To contribute code, please ensure that your submissions adhere to the [Style Guide]; please also be aware that this project is under active development and we have not yet established firm contribution guidelines or acceptance criteria.

### Community

* [Forum][discourse]
* [Gitter]

[code of conduct]: https://github.com/OpenSTFoundation/mosaic.js/blob/develop/CODE_OF_CONDUCT.md
[discourse]: https://discuss.openst.org/
[gitter]: https://gitter.im/OpenSTFoundation/SimpleToken
[issues]: https://github.com/OpenSTFoundation/mosaic.js/issues
[mosaic-contracts]: https://github.com/OpenSTFoundation/mosaic-contracts
[mosaic whitepaper]: https://github.com/OpenSTFoundation/mosaic-contracts/blob/develop/docs/mosaicv0.pdf
[openst whitepaper]: https://drive.google.com/file/d/0Bwgf8QuAEOb7Z2xIeUlLd21DSjQ/view
[style guide]: https://github.com/OpenSTFoundation/mosaic.js/blob/develop/SOLIDITY_STYLE_GUIDE.md
