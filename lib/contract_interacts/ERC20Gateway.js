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

const gatewayJsonInterface = parseFile('../../contracts/abi/GatewayV1.abi', 'utf8'),
  coGatewayJsonInterface = parseFile('../../contracts/abi/CoGatewayV1.abi', 'utf8');

const ERC20Gateway = function(originAddress, originOptions, auxilaryConfig, auxilaryAddress, auxilaryOptions) {
  const oThis = this,
    OriginWeb3 = new oThis.ic().OriginWeb3(),
    originWeb3Obj = new OriginWeb3(),
    AuxiliaryWeb3 = new oThis.ic().AuxiliaryWeb3(),
    auxilaryWeb3Obj = new AuxiliaryWeb3(auxilaryConfig),
    originGateway = new originWeb3Obj.eth.Contract(gatewayJsonInterface, originAddress, originOptions || {}),
    auxilaryGateway = new auxilaryWeb3Obj.eth.Contract(coGatewayJsonInterface, auxilaryAddress, auxilaryOptions || {});

  oThis._getOriginContract = function() {
    return originGateway;
  };
  oThis._getAuxiliaryContract = function() {
    return auxilaryGateway;
  };

  //Bind origin and auxiliary methods.
  generator.bindOriginMethods(oThis, '_getOriginContract');
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};
const proto = (ERC20Gateway.prototype = {
  constructor: ERC20Gateway,
  _getOriginContract: null,
  _getAuxiliaryContract: null
});

let originContractAbi = gatewayJsonInterface;
let originContractGetter = '_getOriginContract';
let auxiliaryContractAbi = coGatewayJsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, originContractAbi, originContractGetter, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(ERC20Gateway, 'ERC20Gateway');

module.exports = ERC20Gateway;
