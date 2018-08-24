"use strict";

const InstanceComposer = require('../../instance_composer');
const generator        = require('../../libs/contract_interacts/generator');

const gatewayJsonInterface    = JSON.parse( fs.readFileSync("../../contracts/abi/Gateway.abi", "utf8") )
    , coGatewayJsonInterface  =  JSON.parse( fs.readFileSync("../../contracts/abi/CoGateway.abi", "utf8") )
;

function ERC20Gateway = function (originAddress, originOptions, auxilaryConfig, auxilaryAddress,  auxilaryOptions ) {
  const oThis = this
      , originWeb3      = new oThis.ic().OriginWeb3()
      , auxilaryWeb3    = new oThis.ic().AuxiliaryWeb3( auxilaryConfig.provider );
      , originGateway   = new originWeb3.eth.Contract(gatewayJsonInterface, originAddress, originOptions || {})
      , auxilaryGateway = new auxilaryWeb3.eth.Contract(coGatewayJsonInterface, auxilaryAddress, auxilaryOptions || {})
  ;

  oThis._getOriginContract = function () {
    return originGateway;
  };
  oThis._getAuxiliaryContract = function () {
    return auxilaryGateway;
  };
  
};
const proto = ERC20Gateway.prototype = {
  constructor: ERC20Gateway
  , _getOriginContract: null
  , _getAuxiliaryContract: null
};

let originContractAbi = gatewayJsonInterface;
let originContractGetter = "_getOriginContract";
let auxiliaryContractAbi = coGatewayJsonInterface;
let auxiliaryContractGetter = "_getAuxiliaryContract";
generator( proto, originContractAbi, originContractGetter, auxiliaryContractAbi, auxiliaryContractGetter );


InstanceComposer.registerShadowableClass(ERC20Gateway, 'ERC20Gateway');

module.exports = ERC20Gateway;