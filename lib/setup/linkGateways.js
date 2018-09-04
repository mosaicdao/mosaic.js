const InstanceComposer = require('../../instance_composer'),
  Proof = require('../../tools/proof/proof_generator'),
  HashLock = require('../../utils/HashLock'),
  helper = require('../../utils/helper'),
  Rsync = require('../../tools/sync/sync');

const GATEWAY_NAME = 'Gateway',
  CO_GATEWAY_NAME = 'CoGateway';

/**
 * @notice This service perform 4 step process to link gateway and co-gateway
 * @param gatewayInstance
 * @param coGatewayInstance
 * @param config
 *
 * @constructor
 */

/*
{
 origin:{
   organization:{
     address:"",
     passPhrase:""
   },
   chainDataPath:"",
   coreContractAddress:"",
   outboxPositionIndex:"",
   token:{
      name: "",
      symbol: "",
      decimal: "",
   }
 },
 auxiliary:{
   organization:{
     address:"",
     passPhrase:""
   },
   chainDataPath:""
 }
}
 */
let path = '/Users/sarveshjain/workspace/sj/mosaic.js/mosaic-setup/originChainData/';
const LinkGateways = function(config) {
  const oThis = this;
  oThis.config = config;

  oThis.origin = config.origin;
  oThis.auxiliary = config.auxiliary;

  oThis.token = config.token;

  oThis.originWeb3 = new (oThis.ic().OriginWeb3())();
  oThis.auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis.origin.coreContractAddress);

  const gatewayABI = helper.getABI(GATEWAY_NAME);
  let gatewayTXOptions = {
    from: oThis.origin.deployerAddress,
    gas: oThis.origin.gas,
    gasPrice: oThis.origin.gasPrice
  };
  oThis.gateway = new oThis.originWeb3.eth.Contract(gatewayABI, oThis.origin.gatewayAddress, gatewayTXOptions);

  const coGatewayABI = helper.getABI(CO_GATEWAY_NAME);
  let coGatewayTXOptions = {
    from: oThis.auxiliary.deployerAddress,
    gas: oThis.auxiliary.gas,
    gasPrice: oThis.auxiliary.gasPrice
  };
  oThis.coGateway = new oThis.auxiliaryWeb3.eth.Contract(
    coGatewayABI,
    oThis.auxiliary.coGatewayAddress,
    coGatewayTXOptions
  );

  oThis.gasPrice = 1000000000;
  oThis.rsync = new Rsync({ path: oThis.config.origin.chainDataPath }, { path: path });
};

LinkGateways.prototype = {
  link: async function() {
    let oThis = this;

    await oThis._unlockOrganization(oThis.origin.organization, oThis.originWeb3);
    await oThis._unlockOrganization(oThis.auxiliary.organization, oThis.auxiliaryWeb3);

    let hashLock = oThis._generateHashLock(),
      senderOrigin = oThis.origin.organization.address,
      senderAuxiliary = oThis.auxiliary.organization.address,
      nonce = await oThis._getNonce(),
      bounty = await oThis._getBounty(),
      intentHash = await oThis._intentHash(bounty, nonce),
      signature = await oThis._signHash(intentHash, nonce, oThis.origin.organization);

    console.log('hashLock', hashLock);
    console.log('nonce', nonce);
    console.log('bounty', bounty);
    console.log('intentHash', intentHash);
    console.log('signature', signature);

    let receipt = await oThis._initiateGatewayLink(
      intentHash,
      oThis.gasPrice,
      nonce,
      senderOrigin,
      hashLock.l,
      signature,
      bounty
    );

    console.log('receipt', receipt);

    let gatewayLinkInitiatedEvent = receipt.events['GatewayLinkInitiated'];
    console.log('Message hash  ', gatewayLinkInitiatedEvent.returnValues.messageHash);
    if (!gatewayLinkInitiatedEvent) {
      throw 'Gateway Link Initiated failed';
    }
    let messageHash = gatewayLinkInitiatedEvent.returnValues.messageHash;

    let blockHeight = receipt.blockNumber,
      stateRoot = await oThis._getStateRoot(blockHeight, oThis.originWeb3);
    console.log('stateRoot ', stateRoot);
    await oThis.rsync.perform();
    console.log('RSYNC done, generating proof');
    let proof = new Proof(stateRoot, path + 'chaindata');
    console.log('gateway address , ', oThis.origin.gatewayAddress.slice(2));
    let gatewayAddress = oThis.origin.gatewayAddress.slice(2),
      gatewayProof = await proof.buildAccountProof(gatewayAddress).catch((error) => {
        console.log(error);
      });
    console.log(gatewayProof);
    let rlpEncodedAccount = gatewayProof.value,
      rlpParentNodes = gatewayProof.parentNodes;

    console.log('proving gateway');
    //for co-gateway
    receipt = await oThis._proveGateway(
      blockHeight,
      rlpEncodedAccount,
      rlpParentNodes,
      oThis.coGateway,
      oThis.auxiliaryWeb3,
      oThis.auxiliary.organization
    );

    console.log('proven gateway');
    console.log('proven  gateway receipt  ', receipt);
    oThis.gatewayOutBoxPosition = '8';
    let storageProof = proof.buildStorageProof(gatewayAddress, oThis.gatewayOutBoxPosition, [messageHash]);
    rlpParentNodes = storageProof[messageHash].parentNodes;

    await oThis._confirmGatewayLinkIntent(
      gatewayAddress,
      intentHash,
      oThis.gasPrice,
      nonce,
      senderOrigin,
      hashLock.l,
      blockHeight,
      rlpParentNodes
    );

    await oThis._processGatewayLink(
      messageHash,
      hashLock.s,
      oThis.gateway,
      oThis.originWeb3,
      oThis.origin.organization
    ); //for gateway
    await oThis._processGatewayLink(
      messageHash,
      hashLock.s,
      oThis.coGateway,
      oThis.auxiliaryWeb3,
      oThis.auxiliary.organization
    ); //for co-gateway
  },

  _intentHash: async function(nonce, bounty) {
    const oThis = this;

    const intentHash = await oThis.gateway.methods
      .hashLinkGateway(
        oThis.origin.gatewayAddress,
        oThis.auxiliary.coGatewayAddress,
        bounty,
        oThis.token.name,
        oThis.token.symbol,
        oThis.token.decimal,
        oThis.gasPrice,
        nonce
      )
      .call({
        from: oThis.origin.organization.address,
        gasPrice: oThis.gasPrice
      });

    return intentHash;
  },

  _getStateRoot: async function(blockNumber, web3) {
    console.log('block number  ', blockNumber);
    let block = await web3.eth.getBlock(blockNumber);
    console.log('block  ', block);
    return Promise.resolve(block.stateRoot);
  },

  _getBounty: async function() {
    let oThis = this;

    let bounty = await oThis.gateway.methods.bounty().call({
      from: oThis.origin.organization.address,
      gasPrice: oThis.gasPrice
    });

    return bounty;
  },

  _getNonce: async function() {
    let oThis = this;

    let nonce = await oThis.gateway.methods.getNonce(oThis.origin.organization.address).call({
      from: oThis.origin.organization.address,
      gasPrice: oThis.gasPrice
    });
    return nonce;
  },

  _signHash: async function(hash, nonce, organization) {
    const oThis = this;
    let typeHash = await oThis.gateway.methods.gatewayLinkTypeHash().call({
      from: oThis.origin.organization.address,
      gasPrice: oThis.gasPrice
    });
    let digest = oThis.originWeb3.utils.soliditySha3(
      { t: 'bytes32', v: typeHash },
      { t: 'bytes32', v: hash },
      { t: 'uint256', v: nonce },
      { t: 'uint256', v: oThis.gasPrice }
    );

    //return await oThis.originWeb3.eth.personal.sign(digest,oThis.origin.organization.address, oThis.origin.organization.passPhrase);
    return await oThis.originWeb3.eth.sign(digest, organization.address);
  },

  _unlockOrganization: async function(organization, web3) {
    console.log('organization ', organization);
    await web3.eth.personal.unlockAccount(organization.address, organization.passPhrase);
  },

  _generateHashLock: function() {
    let hs = new HashLock();
    return hs.getHashLock();
  },

  _initiateGatewayLink: async function(intentHash, gasPrice, nonce, sender, hashLock, signature, bounty) {
    let oThis = this;

    console.log('_initiateGatewayLink args: ', arguments);
    await oThis._unlockOrganization(oThis.origin.organization, oThis.originWeb3);

    return oThis.gateway.methods
      .initiateGatewayLink(intentHash, gasPrice, nonce, sender, hashLock, signature)
      .send({
        from: sender,
        gasPrice: 0,
        gas: 4700000
      })
      .once('error', function(error) {
        Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        Promise.resolve(receipt);
      })
      .once('transactionHash', function(transactionHash) {
        //result['transactionHash'] = transactionHash;
        console.log('transactionHash: ', transactionHash);
      });
  },

  _confirmGatewayLinkIntent: async function(
    gatewayAddress,
    intentHash,
    gasPrice,
    nonce,
    sender,
    hashLock,
    blockHeight,
    rlpParentNodes
  ) {
    let oThis = this;
    let result = {};

    await oThis._unlockOrganization(oThis.auxiliary.organization, oThis.auxiliaryWeb3);
    await oThis.coGateway.methods
      .confirmGatewayLinkIntent(
        gatewayAddress,
        intentHash,
        gasPrice,
        nonce,
        sender,
        hashLock,
        blockHeight,
        rlpParentNodes
      )
      .send({
        from: sender,
        gasPrice: oThis.gasPrice
      })
      .once('error', function(error) {
        return Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        result['receipt'] = receipt;
      })
      .once('transactionHash', function(transactionHash) {
        result['transactionHash'] = transactionHash;
      });

    return result;
  },

  /**
   *
   * @param blockHeight
   * @param rlpEncodedAccount
   * @param rlpParentNodes
   * @param gatewayInstance
   * @param web3
   * @param organization
   * @return {Promise<any>}
   */
  _proveGateway: async function(blockHeight, rlpEncodedAccount, rlpParentNodes, gatewayInstance, web3, organization) {
    console.log('prove gateway arguments  ', blockHeight);
    console.log('prove gateway arguments  ', rlpEncodedAccount);
    let oThis = this;
    let result = {};

    await oThis._unlockOrganization(organization, web3);

    console.log('calling methid');
    await gatewayInstance.methods
      .proveGateway(blockHeight, '0x' + rlpEncodedAccount, '0x' + rlpParentNodes)
      .send({
        from: oThis.auxiliary.deployerAddress,
        gasPrice: 0
      })
      .once('error', function(error) {
        console.log('error ', error);
        return Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        console.log('receipt ', receipt);
        result['receipt'] = receipt;
      })
      .once('transactionHash', function(transactionHash) {
        console.log('transactionHash ', transactionHash);
        result['transactionHash'] = transactionHash;
      });

    console.log('result  ', result);
    return result;
  },

  /**
   * This method will be called for both gateway and co-gateway
   * @param messageHash
   * @param unlockSecret
   * @param gatewayInstance
   * @param web3
   * @param organization
   * @return {Promise<any>}
   */
  _processGatewayLink: async function(messageHash, unlockSecret, gatewayInstance, web3, organization) {
    let oThis = this;
    let result = {};
    await oThis._unlockOrganization(organization, web3);

    await gatewayInstance.methods
      .proveGateway(messageHash, unlockSecret)
      .send({
        from: organization.address,
        gasPrice: oThis.gasPrice
      })
      .once('error', function(error) {
        return Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        result['receipt'] = receipt;
      })
      .once('transactionHash', function(transactionHash) {
        result['transactionHash'] = transactionHash;
      });

    return result;
  }
};

InstanceComposer.registerShadowableClass(LinkGateways, 'LinkGateways');

module.exports = LinkGateways;
