"use strict";

const path = require('path')
    , fs = require('fs')
;

function parseFile(filePath, options) {
 filePath = path.join(__dirname, '/' + filePath);
 const fileContent = fs.readFileSync(filePath, options || 'utf8');
 return JSON.parse(fileContent);
}

const InstanceComposer     = require('../../instance_composer');
const generator            = require('../../lib/contract_interacts/generator');
const coreJsonInterface    = parseFile('../../contracts/abi/Core.abi', 'utf8');

const Core = function (originAddress, originOptions, auxilaryConfig, auxilaryAddress,  auxilaryOptions ) {
  
  const oThis = this
      , OriginWeb3      = new oThis.ic().OriginWeb3()
      , originWeb3Obj   = new OriginWeb3()
      , AuxiliaryWeb3   = new oThis.ic().AuxiliaryWeb3()
      , auxilaryWeb3Obj = new AuxiliaryWeb3( auxilaryConfig )
  ;

  global.originWeb3Obj = originWeb3Obj;
  global.auxilaryWeb3Obj = auxilaryWeb3Obj;

  const originCore      = new originWeb3Obj.eth.Contract(coreJsonInterface, originAddress, originOptions || {})
      , auxilaryCore    = new auxilaryWeb3Obj.eth.Contract(coreJsonInterface, auxilaryAddress, auxilaryOptions || {})
  ;

    

  oThis._getOriginContract = function () {
    return originCore;
  };
  oThis._getAuxiliaryContract = function () {
    return auxilaryCore;
  };
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