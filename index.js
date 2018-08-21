"use strict";

/**
 * Load openST Platform module
 */

const rootPrefix = "."
  , version = require(rootPrefix + '/package.json').version
  , Web3 = require('web3')
;

const Mosaic = function (provider, net, options) {
  const oThis = this;

  //1. Note down the providerBaseEndpoint.
  oThis.providerBaseEndpoint = provider;

  //2. Be exactly like Web3.
  let args = Array.prototype.slice.call(arguments);
  Web3.apply(this, args);

  //3. Now work with deviations if any.
  oThis._auxIdToWeb3Map = {};

  oThis.version = version;
};

//Set the prototype.
Mosaic.prototype = Object.create(Web3.prototype);
//Set the constructor
Mosaic.prototype.constructor = Mosaic;

// Define instance properties here.
Mosaic.prototype.providerBaseEndpoint = null;
Mosaic.prototype._auxIdToWeb3Map = null;

// Define all instance methods here.
Mosaic.prototype.aux = function ( auxiliaryId ) {
  const oThis = this
      , provider = oThis.providerBaseEndpoint
  ;

  //Create new Web3 Instance.
  auxiliaryId = String( auxiliaryId ).toLowerCase(); 
  let auxProvider = provider + "/" + auxiliaryId + "/";

  if ( !oThis._auxIdToWeb3Map.hasOwnProperty( auxiliaryId ) ) {
    let web3 = new Web3( auxProvider );
    oThis._auxIdToWeb3Map[ auxiliaryId ] = web3;
  }
  return oThis._auxIdToWeb3Map[ auxiliaryId ].eth;
};

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











