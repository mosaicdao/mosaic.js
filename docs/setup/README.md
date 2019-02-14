# Setup

This document goes through the steps you need to take to set up a token gateway.

## Prerequisites

You need:

* a connection to nodes that are connected to origin and auxiliary (for help see [how to connect]('../test_net/README.md))
* OST on auxiliary to deploy contracts
* an EIP20 token deployed on origin
* a utility token deployed on auxiliary
* optional: you already have `Organization`s deployed on origin and auxiliary
* optional: you already have state root providers (e.g. `Anchor`s) deployed on origin and auxiliary

The following is required to use mosaic.js setup:

```js
const { Setup } = require('@openstfoundation/mosaic.js');
const Web3 = require('web3');

const origin = {
  web3: new Web3('http://localhost:8545'),
  chainId: '3',
  // The address that you will use to deploy contracts:
  deployer: '0x6d4e5f5ca54b88fdb68a5d0e6ea5aa3869f88116',
  txOptions: {
    gasPrice: '13000000000', // 13 GWei
  },
  // The address of your EIP20 token:
  token: '0x2902a9E437c07168fc73B96821ed82b8eB69B20F',
  // The address of OST (you can use this one):
  baseToken: '0xca954C91BE676cBC4D5Ab5F624b37402E5f0d957',
  // For now, burnt tokens are sent to the zero address
  burner: '0x0000000000000000000000000000000000000000',
  // The address of your organization (owner):
  organization: '0x6d4e5f5ca54b88fdb68a5d0e6ea5aa3869f88116',
};
const auxiliary = {
  web3: new Web3('http://localhost:8546'),
  chainId: '1409',
  // The address that you will use to deploy contracts:
  deployer: '0x48dbe0b823ba5e4a3114925242b75c5ae2041f62',
  txOptions: {
    gasPrice: '1000000000', // 1 GWei
  },
  // The address of the utility token to your EIP20 token:
  utilityToken: '0x10f7af624395843eF6d5c1ca2272B648C35b5B94',
  // For now, burnt tokens are sent to the zero address
  burner: '0x0000000000000000000000000000000000000000',
  // The address of your organization (owner):
  organization: '0x48dbe0b823ba5e4a3114925242b75c5ae2041f62',
};
```

## Organizations

If you don't have any organizations deployed, yet, mosaic.js can help you to deploy organizations
on origin and auxiliary:

```js
const [originOrganization, auxiliaryOrganization] = await Setup.organizations(
  origin.web3,
  auxiliary.web3,
  {
    deployer: origin.deployer,
    owner: origin.organization,
    admin: origin.organization,
    workers: [],
    workerExpirationHeight: '0',
  },
  {
    deployer: auxiliary.deployer,
    owner: auxiliary.organization,
    admin: auxiliary.organization,
    workers: [],
    workerExpirationHeight: '0',
  },
  origin.txOptions,
  auxiliary.txOptions,
);
```

## State Root Providers

```js
const [originAnchor, auxiliaryAnchor] = await Setup.anchors(
  origin.web3,
  auxiliary.web3,
  {
    remoteChainId: auxiliary.chainId,
    maxStateRoots: '10',
    organization: originOrganization.address,
    organizationOwner: origin.organization,
    deployer: origin.deployer,
  },
  {
    remoteChainId: origin.chainId,
    maxStateRoots: '10',
    organization: auxiliaryOrganization.address,
    organizationOwner: auxiliary.organization,
    deployer: auxiliary.deployer,
  },
  origin.txOptions,
  auxiliary.txOptions,
);
```

## Gateways

```js
const [originGateway, auxiliaryCoGateway] = await Setup.gateways(
  origin.web3,
  auxiliary.web3,
  {
    token: origin.token,
    baseToken: origin.baseToken,
    stateRootProvider: originAnchor.address,
    bounty: '0',
    organization: originOrganization.address,
    burner: ZERO_ADDRESS,
    deployer: origin.deployer,
    organizationOwner: origin.organization,
  },
  {
    valueToken: auxiliary.valueToken,
    utilityToken: auxiliary.utilityToken,
    stateRootProvider: auxiliaryAnchor.address,
    bounty: '0',
    organization: auxiliaryOrganization.address,
    burner: ZERO_ADDRESS,
    deployer: auxiliary.deployer,
    organizationOwner: auxiliary.organization,
  },
  origin.txOptions,
  auxiliary.txOptions,
);
```

## Continue Reading

Next, you want to check out how to stake and mint using your new gateways: [Stake and Mint](../stake_and_mint/README.md).

## The entire code

<!--
Data from token and utility token deployment:
```js
{
  origin: {
    rpc: 'http://localhost:8545',
    from: '0x6d4e5f5ca54b88fdb68a5d0e6ea5aa3869f88116',
    gasPrice: '0x5B9ACA00',
    gasLimit: '7000000',
    contractAddresses: {
      Anchor: '0x7dDccC2a3D94B18b4758D9C5255A8C3FAC5507a6',
      JLPToken: '0x2902a9E437c07168fc73B96821ed82b8eB69B20F',
      Organization: '0xa1A672011C031e9b156FF5d231584169407c5031',
    },
  },
  auxiliary: {
    rpc: 'http://localhost:8546',
    from: '0x48dbe0b823ba5e4a3114925242b75c5ae2041f62',
    gasPrice: '0x5B9ACA00',
    gasLimit: '7000000',
    contractAddresses: {
      Anchor: '0xE4F0C9FbB89B2131EfBf4DBa43EDE20489c3cf2b',
      OSTPrime: '0x10f7af624395843eF6d5c1ca2272B648C35b5B94',
      Organization: '0x6cCe1F9f3Da2007f46A1542AC58Cd07d5D760399',
    },
  },
}
```
-->

```js
const { Setup } = require('@openstfoundation/mosaic.js');
const Web3 = require('web3');

const origin = {
  web3: new Web3('http://localhost:8545'),
  chainId: '3',
  // The address that you will use to deploy contracts:
  deployer: '0x6d4e5f5ca54b88fdb68a5d0e6ea5aa3869f88116',
  txOptions: {
    gasPrice: '13000000000', // 13 GWei
  },
  // The address of your EIP20 token:
  token: '0x2902a9E437c07168fc73B96821ed82b8eB69B20F',
  // The address of OST (you can use this one):
  baseToken: '0xca954C91BE676cBC4D5Ab5F624b37402E5f0d957',
  // For now, burnt tokens are sent to the zero address
  burner: '0x0000000000000000000000000000000000000000',
  // The address of your organization (owner):
  organization: '0x6d4e5f5ca54b88fdb68a5d0e6ea5aa3869f88116',
};
const auxiliary = {
  web3: new Web3('http://localhost:8546'),
  chainId: '1409',
  // The address that you will use to deploy contracts:
  deployer: '0x48dbe0b823ba5e4a3114925242b75c5ae2041f62',
  txOptions: {
    gasPrice: '1000000000', // 1 GWei
  },
  // The address of the utility token to your EIP20 token:
  utilityToken: '0x10f7af624395843eF6d5c1ca2272B648C35b5B94',
  // For now, burnt tokens are sent to the zero address
  burner: '0x0000000000000000000000000000000000000000',
  // The address of your organization (owner):
  organization: '0x48dbe0b823ba5e4a3114925242b75c5ae2041f62',
};

const [originOrganization, auxiliaryOrganization] = await Setup.organizations(
  origin.web3,
  auxiliary.web3,
  {
    deployer: origin.deployer,
    owner: origin.organization,
    admin: origin.organization,
    workers: [],
    workerExpirationHeight: '0',
  },
  {
    deployer: auxiliary.deployer,
    owner: auxiliary.organization,
    admin: auxiliary.organization,
    workers: [],
    workerExpirationHeight: '0',
  },
  origin.txOptions,
  auxiliary.txOptions,
);

const [originAnchor, auxiliaryAnchor] = await Setup.anchors(
  origin.web3,
  auxiliary.web3,
  {
    remoteChainId: auxiliary.chainId,
    maxStateRoots: '10',
    organization: originOrganization.address,
    organizationOwner: origin.organization,
    deployer: origin.deployer,
  },
  {
    remoteChainId: origin.chainId,
    maxStateRoots: '10',
    organization: auxiliaryOrganization.address,
    organizationOwner: auxiliary.organization,
    deployer: auxiliary.deployer,
  },
  origin.txOptions,
  auxiliary.txOptions,
);

const [originGateway, auxiliaryCoGateway] = await Setup.gateways(
  origin.web3,
  auxiliary.web3,
  {
    token: origin.token,
    baseToken: origin.baseToken,
    stateRootProvider: originAnchor.address,
    bounty: '0',
    organization: originOrganization.address,
    burner: ZERO_ADDRESS,
    deployer: origin.deployer,
    organizationOwner: origin.organization,
  },
  {
    valueToken: auxiliary.valueToken,
    utilityToken: auxiliary.utilityToken,
    stateRootProvider: auxiliaryAnchor.address,
    bounty: '0',
    organization: auxiliaryOrganization.address,
    burner: ZERO_ADDRESS,
    deployer: auxiliary.deployer,
    organizationOwner: auxiliary.organization,
  },
  origin.txOptions,
  auxiliary.txOptions,
);
```
