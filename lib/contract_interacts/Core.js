"use strict";

const path = require('path')
    , fs = require('fs')
    , EventEmitter = require('events')
;

function parseFile(filePath, options) {
 filePath = path.join(__dirname, '/' + filePath);
 const fileContent = fs.readFileSync(filePath, options || 'utf8');
 return JSON.parse(fileContent);
}

const InstanceComposer     = require('../../instance_composer');
const generator            = require('../../lib/contract_interacts/generator');
const coreJsonInterface    = parseFile('../../contracts/abi/Core.abi', 'utf8');

const Core = function (originCoreAddress, originOptions, auxilaryCoreAddress,  auxilaryOptions ) {
  
  const oThis = this
      , OriginWeb3          = new oThis.ic().OriginWeb3()
      , AuxiliaryWeb3       = new oThis.ic().AuxiliaryWeb3()
      , originWeb3Obj       = new OriginWeb3()
      , originCoreContract  = new originWeb3Obj.eth.Contract(coreJsonInterface, originCoreAddress, originOptions || {})
      , auxilaryWeb3Obj     = new AuxiliaryWeb3( originCoreAddress )
  ;

  oThis._originWeb3Obj      = originWeb3Obj;
  oThis._auxilaryWeb3Obj    = auxilaryWeb3Obj;
  oThis._originCoreContract = originCoreContract;
  oThis._auxilaryWeb3Obj    = auxilaryWeb3Obj;


  let auxilaryCoreContract;
  if ( auxilaryCoreAddress ) {
    auxilaryCoreContract    = new auxilaryWeb3Obj.eth.Contract(coreJsonInterface, auxilaryCoreAddress, auxilaryOptions || {});
    oThis.init(originCoreContract, auxilaryCoreContract );
  } else {
    originCoreContract.methods.coCore().call(function (err, auxilaryCoreAddress) {
      if ( err ) {
        console.log("err", err);  
        oThis.emit('error', err);
      }
      
      console.log("auxilaryCoreAddress", auxilaryCoreAddress);
      auxilaryCoreContract    = new auxilaryWeb3Obj.eth.Contract(coreJsonInterface, auxilaryCoreAddress, auxilaryOptions || {});
      oThis.init(originCoreContract, auxilaryCoreContract );
    });
  }


};
//Derive from EventEmitter.
Core.prototype = Object.create( EventEmitter.prototype );

const proto = {
  constructor: Core
  , _getOriginContract: null
  , _getAuxiliaryContract: null
  , init: function (originCoreContract, auxilaryCoreContract) {
    const oThis = this;

    oThis._getOriginContract = function () {
      return originCore;
    };
    oThis._getAuxiliaryContract = function () {
      return auxilaryCore;
    };
    generator.bindOriginMethods( oThis, "_getOriginContract" );
    generator.bindAuxiliaryMethods( oThis, "_getAuxiliaryContract" );
    oThis.emit('ready');
  }
};


let originContractAbi = coreJsonInterface;
let originContractGetter = "_getOriginContract";
let auxiliaryContractAbi = coreJsonInterface;
let auxiliaryContractGetter = "_getAuxiliaryContract";
generator( proto, originContractAbi, originContractGetter, auxiliaryContractAbi, auxiliaryContractGetter );

//Finally assign the proto.
Object.assign(Core.prototype, proto);

InstanceComposer.registerShadowableClass(Core, 'Core');

module.exports = Core;