'use strict';

const fs = require('fs');

function read(filePath) {
  filePath = path.join(__dirname, '/' + filePath);
  console.log('filePath', filePath);
  return fs.readFileSync(filePath, 'utf8');
}

const Utils = function() {};

Utils.prototype = {
  getABI: async function(contractName) {
    let abi = JSON.parse(read('../../contracts/abi/' + contractName + '.abi'));
    return abi;
  },

  getBIN: async function(contractName) {
    let binCode = read('../../contracts/bin/' + contractName + '.bin');
    return binCode;
  }
};
module.exports = new Utils();
