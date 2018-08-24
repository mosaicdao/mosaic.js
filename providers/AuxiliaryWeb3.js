"use strict";
const Web3 = require('web3');

const InstanceComposer = require('../instance_composer');


function AuxiliaryWeb3 = function ( originCoreContractAddress ) {
  const oThis = this
      , auxiliaries = oThis.ic().configStrategy.auxiliaries
  ;


  let provider, len = auxiliaries.length;
  originCoreContractAddress = String( originCoreContractAddress ).toLowerCase();
  while( len-- ) {
    let auxConfig = auxiliaries[ len ];
    if ( String( auxConfig.originCoreContractAddress ).toLowerCase() === originCoreContractAddress ) {
      provider = auxConfig.provider;
    }
  }

  if ( !provider ) {
    throw "No Auxiliary defined with origin core contract address '" + originCoreContractAddress + "'";
  }

  Web3.call(oThis, provider);
}


if ( Web3.prototype ) {
  AuxiliaryWeb3.prototype = Object.create(Web3.prototype);
} else {
  AuxiliaryWeb3.prototype = {};
}
AuxiliaryWeb3.prototype.constructor = AuxiliaryWeb3;



InstanceComposer.registerShadowableClass(AuxiliaryWeb3, 'AuxiliaryWeb3');

module.exports = AuxiliaryWeb3;