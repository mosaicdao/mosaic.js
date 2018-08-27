"use strict";

const BaseContract = require('web3-eth-contract');

const generator = function ( proto, originContractAbi, originContractGetter, auxiliaryContractAbi, auxiliaryContractGetter ) {
  let originContract, auxContract;
  
  if ( originContractAbi ) {
   originContract = new BaseContract( originContractAbi );
  }

  if ( auxiliaryContractAbi ) {
    auxContract = new BaseContract( auxiliaryContractAbi );
  }

  let originMethods = originContract ? originContract.methods : {};
  let auxMethods = auxContract ? auxContract.methods : {};

  let methodKeys  = Object.keys( originMethods )
    , len         = methodKeys.length
    , methodName
  ;

  proto.oThisObj = function () {
    return this;
  };


  let originMethodKeeper = {};
  while( len-- ) {
    methodName = methodKeys[ len ];
    let methodKeeper = proto;
    if ( auxMethods.hasOwnProperty( methodName ) ) {
      // This needs to be chian specific
      methodKeeper = proto._originMethods = proto._originMethods || [];
      methodKeeper.push( methodName );
    } else {
      methodKeeper[ methodName ] = function () {
        console.log("originContractGetter", originContractGetter);
        global._this = this;
        console.log("oThis[ originContractGetter ]", this[ originContractGetter ]);
          const oThis = this
              , web3ContractObj = oThis[ originContractGetter ]()
              , fnScope = web3ContractObj.methods
              , fn = fnScope[ methodName ]
          ;
          return fn.apply(fnScope, arguments);
      };
    }
  }

  methodKeys  = Object.keys( auxMethods );
  len         = methodKeys.length;
  while( len-- ) {
    methodName = methodKeys[ len ];
    let methodKeeper = proto;
    if ( originMethods.hasOwnProperty( methodName ) ) {
      // This needs to be chian specific
      methodKeeper = proto._auxiliaryMethods = proto._auxiliaryMethods || [];
      methodKeeper.push( methodName );
    } else {
      methodKeeper[ methodName ] = function () {
          const oThis = this
              , web3ContractObj = oThis[ auxiliaryContractGetter ]()
              , fnScope = web3ContractObj.methods
              , fn = fnScope[ methodName ]
          ;
          return fn.apply(fnScope, arguments);
      };
    }

  }
};

generator.bindOriginMethods = function ( instance, contractGetterName ) {
  if ( !instance._originMethods ) {
    return;
  }
  instance.origin = instance.origin || {};

  let methodKeeper  = instance.origin
    , methods       = instance._originMethods
    , len           = methods.length
    , methodName
  ;
  while( len-- ) {
    methodName = methods[ len ];
    methodKeeper[ methodName ] = function () {
        const oThis = instance
            , web3ContractObj = oThis[ contractGetterName ]()
            , fnScope = web3ContractObj.methods
            , fn = fnScope[ methodName ]
        ;
        return fn.apply(fnScope, arguments);
    };
  }
};

generator.bindAuxiliaryMethods = function ( instance, contractGetterName ) {
  if ( !instance._originMethods ) {
    return;
  }
  instance.auxiliary = instance.auxiliary || {}

    let methodKeeper  = instance.auxiliary
    , methods         = instance._auxiliaryMethods
    , len             = methods.length
    , methodName
  ;
  while( len-- ) {
    methodName = methods[ len ];
    methodKeeper[ methodName ] = function () {
        const oThis = instance
            , web3ContractObj = oThis[ contractGetterName ]()
            , fnScope = web3ContractObj.methods
            , fn = fnScope[ methodName ]
        ;
        return fn.apply(fnScope, arguments);
    };
  }
};


module.exports = generator;
