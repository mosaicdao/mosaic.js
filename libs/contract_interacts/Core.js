"use strict";

const InstanceComposer = require('../../instance_composer');
const generator        = require('../../libs/contract_interacts/generator');

const coreJsonInterface    = JSON.parse( fs.readFileSync("../../contracts/abi/Core.abi", "utf8") );

function Core = function (address, options) {
  const oThis = this;
  
};
const proto = Core.prototype = {
  constructor: Core
  , _getOriginContract: null
  , _getAuxiliaryContract: null
};

let originContractAbi = coreJsonInterface;
let originContractGetter = "_getOriginContract";
let auxiliaryContractAbi = coreJsonInterface;
let auxiliaryContractGetter = "_getAuxiliaryContract";
generator( proto, originContractAbi, originContractGetter, auxiliaryContractAbi, auxiliaryContractGetter );


InstanceComposer.registerShadowableClass(Core, 'Core');

module.exports = Core;