const InstanceComposer = require('../../instance_composer');
const Proof = require('proof/proof_generator');
const HashLock = require('../../utils/HashLock');

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
const LinkGateways = function(gateway, coGateway, config) {
  const oThis = this;

  oThis.gateway = gateway;
  oThis.coGateway = coGateway;
  oThis.origin = config.origin;
  oThis.auxiliary = config.auxiliary;
  oThis.originWeb3 = new (oThis.ic().OriginWeb3())();
  oThis.auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis.origin.coreContractAddress);
  oThis.gasPrice = 1000000000;
  oThis.gatewayOutBoxPosition = config.origin.outboxPositionIndex;
  oThis.token = config.token;
};

LinkGateways.prototype = {
  link: async function() {
    let oThis = this;

    let hs = new HashLock();
    let hashLock = hs.getHashLock();

    let senderOrigin = oThis.origin.organization.address;
    let senderAuxiliary = oThis.auxiliary.organization.address;

    let nonce = await oThis._getNonce();
    let bounty = await oThis._getBounty();
    let intentHash = oThis._intentHash(bounty, nonce);
    let signature = oThis._signHash(intentHash, nonce, oThis.origin.organization);

    let receipt = await oThis.initiateGatewayLink(intentHash, oThis.gasPrice, nonce, senderOrigin, hashLock.l, signature);

    let blockHeight = receipt.blockNumber;

    let stateRoot = await oThis._getStateRoot(blockHeight, oThis.originWeb3);

    let proof = new Proof(stateRoot, oThis.origin.chainDataPath);
    //todo rsync
    let gatewayAddress = oThis.gateway.receipt.contractAddress;
    let gatewayProof = await proof.buildAccountProof(gatewayAddress);

    let rlpEncodedAccount = gatewayProof.value;
    let rlpParentNodes = gatewayProof.parentNodes;

    //for co-gateway
    await oThis.proveGateway(
      blockHeight,
      rlpEncodedAccount,
      rlpParentNodes,
      oThis.cogateway,
      oThis.auxiliaryWeb3,
      oThis.origin.organization
    );

    let messageHash;
    let storageProof = proof.buildStorageProof(gatewayAddress, oThis.gatewayOutBoxPosition, [messageHash]);
    rlpParentNodes = storageProof[messageHash].parentNodes;

    await oThis.confirmGatewayLinkIntent(
      gatewayAddress,
      intentHash,
      gasPrice,
      nonce,
      senderOrigin,
      hashLock.l,
      blockHeight,
      rlpParentNodes
    );

    await oThis.processGatewayLink(
      messageHash,
      hashLock.s,
      oThis.gateway.instance,
      oThis.originWeb3,
      oThis.origin.organization
    ); //for gateway
    await oThis.processGatewayLink(
      messageHash,
      hashLock.s,
      oThis.coGateway.instance,
      oThis.auxiliaryWeb3,
      oThis.auxiliary.organization
    ); //for co-gateway
  },

  _intentHash: async function(nonce, bounty) {
    const oThis = this;

    let intentHash = oThis.gateway.instance.methods
      .hashLinkGateway(oThis.originConfig.opsAddress)
      .call(
        oThis.gateway.receipt.address,
        oThis.coGateway.receipt.address,
        bounty,
        oThis.token.name,
        oThis.token.symbol,
        oThis.token.decimal,
        oThis.gasPrice,
        nonce
      );

    return intentHash;
  },

  _getStateRoot: async function(blockNumber, web3) {
    return web3.getBlock(blockNumber).then(function(block) {
      return block.stateRoot;
    });
  },

  _getBounty: function() {
    return oThis.gateway.instance.methods.bounty.call();
  },

  _getNonce: function() {
    return oThis.gateway.instance.method.getNonce.call(oThis.origin.organization.address);
  },
  _signHash: async function(hash, nonce, organization) {
    const oThis = this;
    let typeHash = await oThis.gateway.instance.methods.gatewayLinkTypeHash.call();
    let digest = oThis.originWeb3.utils.soliditySha3(typeHash, hash, nonce, oThis.gasPrice);

    oThis.signers = oThis.ic().Signers();
    oThis.signers.addAccount(organization.address, organization.passphrase);
    return oThis.signers.signTransaction(digest);
  },

  _unlockOrganization: async function(organization, web3) {
    web3.eth.personal.unlockAccount(organization.address, organization.passPhrase);
  },

  _generateHashLock: function() {},

  initiateGatewayLink: async function(intentHash, gasPrice, nonce, sender, hashLock, signature) {
    let oThis = this;
    let result = {};

    await oThis._unlockOrganization(oThis.origin.organization, oThis.originWeb3);

    await oThis.gateway.instance.methods
      .initiateGatewayLink(intentHash, gasPrice, nonce, sender, hashLock, signature)
      .send({
        from: sender,
        gasPrice: oThis.gasPrice
      })
      .once('error', function(error) {
        Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        result['receipt'] = receipt;
      })
      .once('transactionHash', function(transactionHash) {
        result['transactionHash'] = transactionHash;
      });

    return Promise.resolve(result);
  },

  confirmGatewayLinkIntent: async function(
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
    oThis.coGateway.instance.methods
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
        Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        result['receipt'] = receipt;
      })
      .once('transactionHash', function(transactionHash) {
        result['transactionHash'] = transactionHash;
      });

    return Promise.resolve(result);
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
  proveGateway: async function(blockHeight, rlpEncodedAccount, rlpParentNodes, gatewayInstance, web3, organization) {
    let oThis = this;
    let gasPrice = 1000000000;
    let result = {};

    await oThis._unlockOrganization(organization, web3);

    gatewayInstance.methods
      .proveGateway()
      .send({
        from: organization.address,
        gasPrice: oThis.gasPrice
      })
      .once('error', function(error) {
        Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        result['receipt'] = receipt;
      })
      .once('transactionHash', function(transactionHash) {
        result['transactionHash'] = transactionHash;
      });

    return Promise.resolve(result);
  },

  /**
   * This method will be called for both gateway and co-gateway
   * @param messageHash
   * @param unlockSecret
   */
  processGatewayLink: async function(messageHash, unlockSecret, gatewayInstance, web3, organization) {
    let oThis = this;
    let result = {};
    await oThis._unlockOrganization(organization, web3);

    gatewayInstance.methods
      .proveGateway(messageHash, unlockSecret)
      .send({
        from: organization.address,
        gasPrice: oThis.gasPrice
      })
      .once('error', function(error) {
        Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        result['receipt'] = receipt;
      })
      .once('transactionHash', function(transactionHash) {
        result['transactionHash'] = transactionHash;
      });

    return Promise.resolve(result);
  }
};

InstanceComposer.registerShadowableClass(LinkGateways, 'LinkGateways');

module.exports = LinkGateways;
