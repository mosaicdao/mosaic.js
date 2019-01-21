'use strict';

const path = require('path'),
  fs = require('fs');

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
}

const InstanceComposer = require('../../instance_composer');
const generator = require('../../lib/contract_interacts/generator');
const workersJsonInterface = parseFile('../../contracts/abi/Workers.abi', 'utf8');

const Workers = function() {
  const oThis = this,
    OriginWeb3 = new oThis.ic().OriginWeb3(),
    originWeb3Obj = new OriginWeb3(),
    AuxiliaryWeb3 = new oThis.ic().AuxiliaryWeb3(),
    auxilaryWeb3Obj = new AuxiliaryWeb3(auxilaryConfig),
    originWorkers = new originWeb3Obj.eth.Contract(workersJsonInterface, originAddress, originOptions || {}),
    auxilaryWorkers = new auxilaryWeb3Obj.eth.Contract(workersJsonInterface, auxilaryAddress, auxilaryOptions || {});

  oThis._getOriginContract = function() {
    return originWorkers;
  };
  oThis._getAuxiliaryContract = function() {
    return auxilaryWorkers;
  };
};

const proto = (Workers.prototype = {
  constructor: Workers,
  _getOriginContract: null,
  _getAuxiliaryContract: null
});

let originContractAbi = workersJsonInterface;
let originContractGetter = '_getOriginContract';
let auxiliaryContractAbi = workersJsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';

generator(proto, originContractAbi, originContractGetter, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(Workers, 'Workers');

module.exports = Workers;
