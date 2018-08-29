'use strict';

const shell = require('shelljs');

const InitChains = function() {};

InitChains.prototype = {
  perform: async function() {
    // remove earlier setup
  }
};

// commander

new InitChains({
  setup_root: '~/mosaic'
}).perform();
