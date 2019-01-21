'use strict';

const InstanceComposer = require('../../instance_composer');
const generator = require('../../lib/contract_interacts/generator');

const path = require('path'),
  fs = require('fs');

require('../../providers/OriginWeb3');
require('../../providers/AuxiliaryWeb3');

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
}

const mockTokenJsonInterface = parseFile('../../contracts/abi/MockToken.abi', 'utf8'); //TODO: add to auxiliary token interface

const MockToken = function(originAddress, originOptions, auxilaryConfig, auxiliaryAddress, auxiliaryOptions) {
  const oThis = this,
    OriginWeb3 = new oThis.ic().OriginWeb3(),
    originWeb3Obj = new OriginWeb3(),
    AuxiliaryWeb3 = new oThis.ic().AuxiliaryWeb3(),
    auxilaryWeb3Obj = new AuxiliaryWeb3(auxilaryConfig),
    originMockToken = new originWeb3Obj.eth.Contract(mockTokenJsonInterface, originAddress, originOptions || {}),
    auxiliaryMockToken = new auxilaryWeb3Obj.eth.Contract(
      mockTokenJsonInterface,
      auxiliaryAddress,
      auxiliaryOptions || {}
    );

  oThis._getOriginContract = function() {
    return originMockToken;
  };
  oThis._getAuxiliaryContract = function() {
    return auxiliaryMockToken;
  };

  //Bind origin and auxiliary methods.
  generator.bindOriginMethods(oThis, '_getOriginContract');
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};
const proto = (MockToken.prototype = {
  constructor: MockToken,
  _getOriginContract: null,
  _getAuxiliaryContract: null
});

let originContractAbi = mockTokenJsonInterface;
let originContractGetter = '_getOriginContract';
let auxiliaryContractAbi = mockTokenJsonInterface; //TODO: change to auxiliary token
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, originContractAbi, originContractGetter, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(MockToken, 'MockToken');

module.exports = MockToken;
