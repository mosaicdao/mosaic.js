const InstanceComposer = require('../../instance_composer');
const Proof = require('proof/proof_generator');

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
   coreContractAddress:""
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
};

LinkGateways.prototype = {
  link: async function() {
    let oThis = this;

    let intentHash = this._intentHash(); //fill
    let signature = this._signHash(); //fill

    let hashLock;
    let unlockSecret;
    let gasPrice;
    let senderOrigin = oThis.origin.organization.address;
    let senderAuxiliary = oThis.auxiliary.organization.address;

    let receipt = await oThis.initiateGatewayLink(intentHash, gasPrice, nonce, senderOrigin, hashLock, signature);
    let stateRoot;
    let blockHeight;
    let proof = new Proof(stateRoot, oThis.origin.chainDataPath);
    //todo rsync
    let gatewayProof = await proof.buildAccountProof(oThis.gateway.receipt.contractAddress);

    let rlpEncodedAccount = gatewayProof.value;
    let rlpParentNodes = gatewayProof.parentNodes;

    await proveGateway(blockHeight, rlpEncodedAccount, rlpParentNodes, oThis.cogateway, oThis.auxiliaryWeb3); //for co-gateway

    await processGatewayLink(messageHash, unlockSecret); //for gateway

    await processGatewayLink(messageHash, unlockSecret); //for co-gateway
  },

  _intentHash: function(coGateway, bounty, tokenName, tokenSymbol, tokenDecimals, gasPrice, nonce) {},

  _getNonce: function() {},
  _signHash: function(hash) {},

  _unlockOrganization: async function(organization, web3) {
    web3.eth.personal.unlockAccount(organization.address, organization.passPhrase);
  },

  initiateGatewayLink: async function(intentHash, gasPrice, nonce, sender, hashLock, signature) {
    let oThis = this;
    let result = {};

    await oThis._unlockOrganization(oThis.origin.organization, oThis.originWeb3);

    await oThis.gateway.instance.methods
      .initiateGatewayLink(intentHash, gasPrice, nonce, sender, hashLock, signature)
      .send({
        from: sender,
        gasPrice: gasPrice
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
   * @param blockHeight
   * @param rlpEncodedAccount
   * @param rlpParentNodes
   */
  proveGateway: function(blockHeight, rlpEncodedAccount, rlpParentNodes) {},

  confirmGatewayLinkIntent: function(
    gatewayAddress,
    intentHash,
    gasPrice,
    nonce,
    sender,
    hashLock,
    blockHeight,
    rlpParentNodes
  ) {},

  /**
   * This method will be called for both gateway and co-gateway
   * @param messageHash
   * @param unlockSecret
   */
  processGatewayLink: function(messageHash, unlockSecret) {}
};

InstanceComposer.registerShadowableClass(LinkGateways, 'LinkGateways');

module.exports = LinkGateways;
