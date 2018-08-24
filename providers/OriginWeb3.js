"use strict";
const Web3 = require('web3');

const InstanceComposer = require('../instance_composer');


const OriginWeb3 = function () {
  const oThis = this
      , provier = oThis.ic().configStrategy.origin.provider
  ;

  Web3.call(oThis, provier);
}


if ( Web3.prototype ) {
  OriginWeb3.prototype = Object.create(Web3.prototype);
} else {
  OriginWeb3.prototype = {};
}
OriginWeb3.prototype.constructor = OriginWeb3;



InstanceComposer.registerShadowableClass(OriginWeb3, 'OriginWeb3');
module.exports = OriginWeb3;