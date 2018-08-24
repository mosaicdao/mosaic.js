"use strict";

/**
 * Load openST Platform module
 */

const Web3 = require('web3')
    , web3Utils = require('web3-utils')
;
const InstanceComposer = require('./instance_composer');
const version = require('./package.json').version;

require('./libs/contracts');
require('./providers/OriginWeb3');
require('./providers/AuxiliaryWeb3');




const Mosaic = function (rumNodeProvider, configurations ) {
  const oThis = this;
  oThis._sanitizeConfigurations();

  oThis.configurations = Object.assign({}, {rumNodeProvider: rumNodeProvider}, configurations);

  const _instanceComposer =  new InstanceComposer(oThis.configurations);
  oThis.ic =  function () {
    return _instanceComposer;
  };

  //1. Note down the rumNodeEndPoint.
  oThis.rumNodeEndPoint = rumNodeProvider;

  //2. Define origin
  let OriginWeb3 = oThis.ic().OriginWeb3();
  let _origin = new OriginWeb3();
  oThis.origin = function () {
    return _origin;
  };

  //3. Define core
  let AuxiliaryWeb3 = oThis.ic().AuxiliaryWeb3();
  oThis.core = function ( originCoreContractAddress ) {
    return new AuxiliaryWeb3( originCoreContractAddress );
  };

  //4. Define contracts
  oThis.contracts = oThis.ic().Contracts();

};

Mosaic.prototype = {
  constructor: Mosaic,
  configurations: null,
  _sanitizeConfigurations: function () {
    const oThis = this
        , configurations = oThis.configurations
    ;

    let areOptionsValid = true;

    if ( !configurations.hasOwnProperty('origin') || typeof configurations.origin != 'object' ) {
      throw "Config Missing. 'origin' configuration is missing.";
    }

    if ( typeof configurations.origin.provider !== 'string' ) {
      throw "Invalid Origin Config. 'provider' configuration is missing.";
    }

    let auxiliaries = configurations.auxiliaries;
    if ( !auxiliaries || !auxiliaries instanceof Array ) { 
      throw "Config Missing. 'auxiliaries' configuration is missing. auxiliaries should be an Array of auxiliary config";
    }

    let len = auxiliaries.length;
    while( len-- ) {
      let auxConfig = auxiliaries[ len ];
      if ( !auxConfig || typeof auxConfig !== 'object' ) {
        throw "Invalid Auxiliary Config. auxiliary config should be an object.";   
      }
      if ( typeof auxConfig.provider !== 'string' ) {
        throw "Invalid Auxiliary Config. 'provider' configuration is missing.";
      }

      if ( auxConfig.originCoreContractAddress && !web3Utils.isAddress( auxConfig.originCoreContractAddress ) ) {
        throw "Invalid Auxiliary Config. 'originCoreContractAddress' should be a valid Address.";
      }
    }
  }
}


module.exports = Mosaic;

/*

//Web3 Way:
web3 = new Web3("http://127.0.0.1:8545");
//-----------------------------------------------//
let eth = web3.eth;
eth.getBalance("0x0000000000000000000000000000000000000000",null,function () {
  //This is my callback.
});

OR

web3.eth.getBalance("0x0000000000000000000000000000000000000000",null,function () {
  //This is my callback.
});
//-----------------------------------------------//

//Mosaic Way
mosaic = new Mosaic("http://127.0.0.1:14545"); //All OstWeb3 params.

//-----------------------------------------------//
//Setup:
mosaic.setup.initCores( origin_core_contract_address );
mosaic.setup.initGateways( origin_core_contract_address );
//-----------------------------------------------//

//-----------------------------------------------//
//Access Value Chain web3.eth
let eth = mosaic.eth;
eth.getBalance("0x0000000000000000000000000000000000000000",null,function () {
  //This is my callback.
});

OR

mosaic.eth.getBalance("0x0000000000000000000000000000000000000000",null,function () {
  //This is my callback.
});
//-----------------------------------------------//
//Access Auxiliary Chain
let aux = mosaic.aux( origin_core_contract_address );
aux.getBalance("0x0000000000000000000000000000000000000000",null,function () {
  //This is my callback.
});

OR 

mosaic.aux( origin_core_contract_address ).getBalance("0x0000000000000000000000000000000000000000",null,function () {
  //This is my callback.
});

//-----------------------------------------------//

*/











