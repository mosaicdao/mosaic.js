'use strict';

const fs = require('fs');

const Helper = function() {};

Helper.prototype = {

  getABI: async function(contractName) {
    const oThis = this;
    let abi = JSON.parse(oThis._read('../../contracts/abi/' + contractName + '.abi'));
    return abi;
  },

  getBIN: async function(contractName) {
    const oThis = this;
    let binCode = oThis._read('../../contracts/bin/' + contractName + '.bin');
    return binCode;
  },

  _read: async function(filePath) {
    filePath = path.join(__dirname, '/' + filePath);
    console.log('filePath', filePath);
    return fs.readFileSync(filePath, 'utf8');
  }

};
module.exports = new Helper();
