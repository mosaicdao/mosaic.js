const InstanceComposer = require('../../instance_composer');
const Proof = require('tools/proof/proof_generator');
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

    let hashLock = oThis._generateHashLock(),
      senderOrigin = oThis.origin.organization.address,
      senderAuxiliary = oThis.auxiliary.organization.address,
      nonce = await oThis._getNonce(),
      bounty = await oThis._getBounty(),
      intentHash = oThis._intentHash(bounty, nonce),
      signature = oThis._signHash(intentHash, nonce, oThis.origin.organization);

    let receipt = await oThis._initiateGatewayLink(
      intentHash,
      oThis.gasPrice,
      nonce,
      senderOrigin,
      hashLock.l,
      signature
    );

    let gatewayLinkInitiatedEvent = receipt.events['GatewayLinkInitiated'];

    if (!gatewayLinkInitiatedEvent) {
      throw 'Gateway Link Initiated failed';
    }
    let messageHash = gatewayLinkInitiatedEvent.messageHash;

    let blockHeight = receipt.blockNumber,
      stateRoot = await oThis._getStateRoot(blockHeight, oThis.originWeb3);

    //todo rsync
    let proof = new Proof(stateRoot, oThis.origin.chainDataPath),
      gatewayAddress = oThis.gateway.receipt.contractAddress,
      gatewayProof = await proof.buildAccountProof(gatewayAddress),
      rlpEncodedAccount = gatewayProof.value,
      rlpParentNodes = gatewayProof.parentNodes;

    //for co-gateway
    await oThis._proveGateway(
      blockHeight,
      rlpEncodedAccount,
      rlpParentNodes,
      oThis.cogateway,
      oThis.auxiliaryWeb3,
      oThis.origin.organization
    );

    let storageProof = proof.buildStorageProof(gatewayAddress, oThis.gatewayOutBoxPosition, [messageHash]);
    rlpParentNodes = storageProof[messageHash].parentNodes;

    await oThis._confirmGatewayLinkIntent(
      gatewayAddress,
      intentHash,
      gasPrice,
      nonce,
      senderOrigin,
      hashLock.l,
      blockHeight,
      rlpParentNodes
    );

    await oThis._processGatewayLink(
      messageHash,
      hashLock.s,
      oThis.gateway.instance,
      oThis.originWeb3,
      oThis.origin.organization
    ); //for gateway
    await oThis._processGatewayLink(
      messageHash,
      hashLock.s,
      oThis.coGateway.instance,
      oThis.auxiliaryWeb3,
      oThis.auxiliary.organization
    ); //for co-gateway
  },

  _intentHash: async function(nonce, bounty) {
    const oThis = this;

    return oThis.gateway.instance.methods
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
  },

  _getStateRoot: async function(blockNumber, web3) {
    return web3.getBlock(blockNumber).then(function(error, block) {
      if (error) {
        Promise.reject(error);
      }
      return Promise.resolve(block.stateRoot);
    });
  },

  _getBounty: function() {
    let oThis = this;
    return oThis.gateway.instance.methods.bounty.call();
  },

  _getNonce: function() {
    let oThis = this;
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

  _generateHashLock: function() {
    let hs = new HashLock();
    return hs.getHashLock();
  },

  _initiateGatewayLink: async function(intentHash, gasPrice, nonce, sender, hashLock, signature) {
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

    return result;
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
    await oThis.coGateway.instance.methods
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
    let oThis = this;
    let result = {};

    await oThis._unlockOrganization(organization, web3);

    await gatewayInstance.methods
      .proveGateway()
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
