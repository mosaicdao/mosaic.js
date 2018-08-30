const InstanceComposer = require('../../instance_composer');

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
const LinkGateways = function(gatewayInstance, coGatewayInstance, config) {
  const oThis = this;

  oThis.gatewayInstance = gatewayInstance;
  oThis.coGatewayInstance = coGatewayInstance;
  oThis.origin = config.origin;
  oThis.auxiliary = config.auxiliary;
  oThis.originWeb3 = new (oThis.ic().OriginWeb3())();
  oThis.originWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis.origin.coreContractAddress);
};

LinkGateways.prototype = {
  link: function() {},
  _intentHash: function(coGateway, bounty, tokenName, tokenSymbol, tokenDecimals, gasPrice, nonce) {},

  _signHash: function(hash) {},

  initiateGatewayLink: function(intentHash, gasPrice, nonce, sender, hashLock, signature) {},

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

LinkGateways.registerShadowableClass(LinkGateways, 'LinkGateways');

module.exports = LinkGateways;
