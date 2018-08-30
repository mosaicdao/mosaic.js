'use strict';

const crypto = require('crypto'),
  keccak256 = require('keccak');

const HashLock = function() {};

HashLock.prototype = {
  getHashLock: function() {
    var secretBytes = crypto.randomBytes(32);
    var lock =
      '0x' +
      keccak256('keccak256')
        .update(secretBytes)
        .digest('hex');
    var unlockSecret = '0x' + secretBytes.toString('hex');
    return { s: unlockSecret, l: lock };
  }
};

module.exports = HashLock;
