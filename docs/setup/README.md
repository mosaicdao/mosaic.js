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

Organizations are used for access control to specific methods of contracts.

If you don't have any organizations deployed, yet, mosaic.js can help you to deploy organizations
on origin and auxiliary:

```js
const [originOrganization, auxiliaryOrganization] = await Setup.organizations(
  origin.web3,
  auxiliary.web3,
  {
    deployer: origin.deployer,
    // The owner of an organization contract has all privileges:
    owner: origin.organization,
    // Some privileges are delegated to an admin:
    admin: origin.organization,
    // Workers are optional and can help with some simple tasks:
    workers: [],
    // Workers always expire at a certain block height:
    workerExpirationHeight: '0',
  },
  {
    deployer: auxiliary.deployer,
    // The owner of an organization contract has all privileges:
    owner: auxiliary.organization,
    // Some privileges are delegated to an admin:
    admin: auxiliary.organization,
    // Workers are optional and can help with some simple tasks:
    workers: [],
    // Workers always expire at a certain block height:
    workerExpirationHeight: '0',
  },
  origin.txOptions,
  auxiliary.txOptions,
);
```

## State Root Providers

In mosaic, you need state root providers that provide state roots of the respective other chain.
On origin you need a state root provider that provides the state root of auxiliary and vice versa.

If you don't have any state root providers deployed, yet, mosaic can help you deploy anchors on
origin and auxiliary.
Anchors are simple, restricted state root providers that you can use to test your deployment.

```js
const [originAnchor, auxiliaryAnchor] = await Setup.anchors(
  origin.web3,
  auxiliary.web3,
  {
    // The chain id of the chain that is tracked by this anchor:
    remoteChainId: auxiliary.chainId,
    // Anchors use ring buffers to limit the number of state roots they store:
    maxStateRoots: '10',
    organization: originOrganization.address,
    organizationOwner: origin.organization,
    deployer: origin.deployer,
  },
  {
    // The chain id of the chain that is tracked by this anchor:
    remoteChainId: origin.chainId,
    // Anchors use ring buffers to limit the number of state roots they store:
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

You use gateways to transfer your tokens from origin to auxiliary and back.
Gateways require an organization for management tasks and state root providers in order to enable
Merkle-Patricia-Proofs for the partner-gateway on the other chain.

Mosaic can help you deploy and activate gateways on origin and auxiliary:

```js
const [originGateway, auxiliaryCoGateway] = await Setup.gateways(
  origin.web3,
  auxiliary.web3,
  {
    // The EIP20 token that you want to use for your economy:
    token: origin.token,
    // The EIP20 token that is used as the base token on auxiliary:
    baseToken: origin.baseToken,
    stateRootProvider: originAnchor.address,
    // The bounty is the amount that facilitators will earn for progressing stake processes:
    bounty: '0',
    organization: originOrganization.address,
    // The burner address is the address where burnt tokens will be transferred to:
    burner: origin.burner,
    deployer: origin.deployer,
    organizationOwner: origin.organization,
  },
  {
    // The utility token wraps and unwraps base tokens of auxiliary to be transferred as EIP20
    // tokens through the gateway:
    utilityToken: auxiliary.utilityToken,
    stateRootProvider: auxiliaryAnchor.address,
    // The bounty is the amount that facilitators will earn for progressing stake processes:
    bounty: '0',
    organization: auxiliaryOrganization.address,
    // The burner address is the address where burnt tokens will be transferred to:
    burner: auxiliary.burner,
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
    // The owner of an organization contract has all privileges:
    owner: origin.organization,
    // Some privileges are delegated to an admin:
    admin: origin.organization,
    // Workers are optional and can help with some simple tasks:
    workers: [],
    // Workers always expire at a certain block height:
    workerExpirationHeight: '0',
  },
  {
    deployer: auxiliary.deployer,
    // The owner of an organization contract has all privileges:
    owner: auxiliary.organization,
    // Some privileges are delegated to an admin:
    admin: auxiliary.organization,
    // Workers are optional and can help with some simple tasks:
    workers: [],
    // Workers always expire at a certain block height:
    workerExpirationHeight: '0',
  },
  origin.txOptions,
  auxiliary.txOptions,
);

const [originAnchor, auxiliaryAnchor] = await Setup.anchors(
  origin.web3,
  auxiliary.web3,
  {
    // The chain id of the chain that is tracked by this anchor:
    remoteChainId: auxiliary.chainId,
    // Anchors use ring buffers to limit the number of state roots they store:
    maxStateRoots: '10',
    organization: originOrganization.address,
    organizationOwner: origin.organization,
    deployer: origin.deployer,
  },
  {
    // The chain id of the chain that is tracked by this anchor:
    remoteChainId: origin.chainId,
    // Anchors use ring buffers to limit the number of state roots they store:
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
    // The EIP20 token that you want to use for your economy:
    token: origin.token,
    // The EIP20 token that is used as the base token on auxiliary:
    baseToken: origin.baseToken,
    stateRootProvider: originAnchor.address,
    // The bounty is the amount that facilitators will earn for progressing stake processes:
    bounty: '0',
    organization: originOrganization.address,
    // The burner address is the address where burnt tokens will be transferred to:
    burner: origin.burner,
    deployer: origin.deployer,
    organizationOwner: origin.organization,
  },
  {
    // The utility token wraps and unwraps base tokens of auxiliary to be transferred as EIP20
    // tokens through the gateway:
    utilityToken: auxiliary.utilityToken,
    stateRootProvider: auxiliaryAnchor.address,
    // The bounty is the amount that facilitators will earn for progressing stake processes:
    bounty: '0',
    organization: auxiliaryOrganization.address,
    // The burner address is the address where burnt tokens will be transferred to:
    burner: auxiliary.burner,
    deployer: auxiliary.deployer,
    organizationOwner: auxiliary.organization,
  },
  origin.txOptions,
  auxiliary.txOptions,
);
```
