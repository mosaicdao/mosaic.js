"use strict";

const InstanceComposer = require('../instance_composer');

require('./setup/initCore');
require('./setup/initMessageBus');

const Setup = function ( config, ic ) {};

Setup.prototype = {
  /**
   * originConfig = {
   *    provider: 'http://...',
   *    deployerAddress: '0x000...',
   *    opsAddress: '0x000...',
   *    workerAddress: '0x000...',
   *    registrar: '0x000...',
   *    chainId: 123,
   *    chainIdRemote: 234,
   *    remoteChainBlockGenerationTime: 15,
   *    openSTRemote: '0x000...'
   * }
   * auxliaryConfig = {
   *    provider: 'http://...',
   *    deployerAddress: '0x000...',
   *    opsAddress: '0x000...',
   *    workerAddress: '0x000...',
   *    registrar: '0x000...',
   *    chainId: 123,
   *    chainIdRemote: 234,
   *    remoteChainBlockGenerationTime: 15,
   *    openSTRemote: '0x000...'
   * }
   */
  initCore: function (originConfig, auxliaryConfig) {
    const oThis = this
      , InitCore = oThis.ic().InitCore()
    ;

    return new InitCore(originConfig, auxliaryConfig).perform();
  },

  initMessageBus: function (originConfig, auxliaryConfig) {
    const oThis = this
      , InitMessageBus = oThis.ic().InitMessageBus()
    ;

    return new InitMessageBus(originConfig, auxliaryConfig).perform();
  }
};


InstanceComposer.register(Setup, 'Setup', true);
module.exports = Setup;