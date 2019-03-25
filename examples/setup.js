const { Setup } = require('@openst/mosaic.js');
const Web3 = require('web3');

// Set-up your configuration (origin and auxiliary):
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
  masterKey: '0x6d4e5f5ca54b88fdb68a5d0e6ea5aa3869f88116',
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
  masterKey: '0x48dbe0b823ba5e4a3114925242b75c5ae2041f62',
};

const run = async () => {
  const [
    originOrganization,
    auxiliaryOrganization,
  ] = await Setup.organizations(
    origin.web3,
    auxiliary.web3,
    {
      deployer: origin.deployer,
      // The owner of an organization contract has all privileges:
      owner: origin.masterKey,
      // Some privileges are delegated to an admin:
      admin: origin.masterKey,
      // Workers are optional and can help with some simple tasks:
      workers: [],
      // Workers always expire at a certain block height:
      workerExpirationHeight: '0',
    },
    {
      deployer: auxiliary.deployer,
      // The owner of an organization contract has all privileges:
      owner: auxiliary.masterKey,
      // Some privileges are delegated to an admin:
      admin: auxiliary.masterKey,
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
      organizationOwner: origin.masterKey,
      deployer: origin.deployer,
    },
    {
      // The chain id of the chain that is tracked by this anchor:
      remoteChainId: origin.chainId,
      // Anchors use ring buffers to limit the number of state roots they store:
      maxStateRoots: '10',
      organization: auxiliaryOrganization.address,
      organizationOwner: auxiliary.masterKey,
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
      organizationOwner: origin.masterKey,
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
      organizationOwner: auxiliary.masterKey,
    },
    origin.txOptions,
    auxiliary.txOptions,
  );

  console.log(originGateway.address, auxiliaryCoGateway.address);
};

// Execute the deployment:
run();
