"use strict";
const Web3 = require('web3');

const InstanceComposer = require('../instance_composer');


let _instances = {};

const OriginWeb3 = function () {
  const oThis = this
      , provider = oThis.ic().configStrategy.origin.provider
  ;

  if ( _instances[ provider ] ) {
    return _instances[ provider ];
  }
  _instances[ provider ] = oThis;

  Web3.call(oThis, provider);
}


if ( Web3.prototype ) {
  OriginWeb3.prototype = Object.create(Web3.prototype);
} else {
  OriginWeb3.prototype = {};
}
OriginWeb3.prototype.constructor = OriginWeb3;



InstanceComposer.registerShadowableClass(OriginWeb3, 'OriginWeb3');
module.exports = OriginWeb3;