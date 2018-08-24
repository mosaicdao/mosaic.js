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

  while( len-- ) {
    methodName = methodKeys[ len ];
    let methodKeeper = proto;
    if ( auxMethods.hasOwnProperty( methodName ) ) {
      // This needs to be chian specific
      methodKeeper = proto.origin = proto.origin || {};
    };

    methodKeeper[ methodName ] = function () {
        const oThis = this
            , web3ContractObj = oThis[ originContractGetter ]()
            , fnScope = web3ContractObj.methods
            , fn = fnScope[ methodName ]
        ;
        return fn.apply(fnScope, arguments);
    };
  }

  methodKeys  = Object.keys( auxMethods );
  len         = methodKeys.length;
  while( len-- ) {
    methodName = methodKeys[ len ];
    let methodKeeper = proto;
    if ( originMethods.hasOwnProperty( methodName ) ) {
      // This needs to be chian specific
      methodKeeper = proto.auxiliary = proto.auxiliary || {};
    };

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


module.exports = generator;
