'use strict';
const Ajv = require('ajv');
const Web3Utils = require('web3-utils');
const Web3Abi = require('web3-eth-abi');

//Schema as defined by EIP-712
const TYPED_DATA_JSON_SCHEMA = {
  type: 'object',
  properties: {
    types: {
      type: 'object',
      properties: {
        EIP712Domain: { type: 'array' }
      },
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' }
          },
          required: ['name', 'type']
        }
      },
      required: ['EIP712Domain']
    },
    primaryType: { type: 'string' },
    domain: { type: 'object' },
    message: { type: 'object' }
  },
  required: ['types', 'primaryType', 'domain', 'message']
};

// options can be passed, e.g. {allErrors: true}
const typedDataValidatorFunction = (function(schema) {
  const ajv = new Ajv();
  return ajv.compile(schema);
})(TYPED_DATA_JSON_SCHEMA);

const DEFAULT_EIP712_DOMAIN_TYPE = [{ name: 'verifyingContract', type: 'address' }];

class TypedData {
  constructor(types, primaryType, domain, message) {
    const oThis = this;

    oThis.setTypes(types);
    oThis.setPrimaryType(primaryType);
    oThis.setDomain(domain);
    oThis.setMessage(message);
  }

  get INITIAL_BYTE() {
    return '0x19';
  }

  get VERSION() {
    return '0x01';
  }

  //method to set Primary Type
  setPrimaryType(primaryType) {
    const oThis = this;
    oThis.primaryType = primaryType;
  }

  //method to get Primary Type
  getPrimaryType() {
    const oThis = this;
    return oThis.primaryType;
  }

  //method to set domain
  setDomain(domain) {
    const oThis = this;
    oThis.domain = domain;
  }

  //method to get domain
  getDomain() {
    const oThis = this;
    return oThis.domain;
  }

  //method to set Message
  setMessage(message) {
    const oThis = this;
    oThis.message = message;
  }

  //method to get message
  getMessage() {
    const oThis = this;
    return oThis.message;
  }

  //Method to provide 'types' object as specified in EIP-712.
  setTypes(types) {
    const oThis = this;
    types = types || {};
    oThis.types = oThis.types || {};

    Object.assign(oThis.types, types);

    if (!(oThis.types.EIP712Domain instanceof Array)) {
      // TODO Clone DEFAULT_EIP712_DOMAIN_TYPE before assigning.
      // Assign the cloned array.
      oThis.types.EIP712Domain = DEFAULT_EIP712_DOMAIN_TYPE;
    }
  }

  //Method to add another data-type to the 'types' object.
  setDataType(dataType, dataTypeProperties) {
    const oThis = this;
    const types = oThis.types;
    types[dataType] = dataTypeProperties;
  }

  //Method to get 'types' object
  getTypes() {
    const oThis = this;
    return oThis.types;
  }

  getDataType(dataType) {
    const oThis = this;
    return oThis.types[dataType];
  }

  getDataTypeDependencies(dataType, found = []) {
    const oThis = this;

    let types = oThis.types;

    if (found.includes(dataType)) {
      return found;
    }

    let dataTypeProperties = oThis.getDataType(dataType);
    if (dataTypeProperties === undefined) {
      return found;
    }
    found.push(dataType);
    for (let field of dataTypeProperties) {
      for (let dep of oThis.getDataTypeDependencies(field.type, found)) {
        if (!found.includes(dep)) {
          found.push(dep);
        }
      }
    }
    return found;
  }

  //Method to encode dataType
  encodeDataType(dataType) {
    const oThis = this;
    /*
      Find out dependencies
    */
    let deps = oThis.getDataTypeDependencies(dataType);
    /*
      Sorting Logic:
      a. filter out input dataType from dependencies.
      b. Sort the dependencies
      b. Creates new dependencies array with dataType as first element.
    */
    deps = deps.filter((t) => t != dataType);
    deps = [dataType].concat(deps.sort());

    // Format as a string with fields
    let types = oThis.getTypes();
    let result = '';
    for (let type of deps) {
      result += `${type}(${types[type].map(({ name, type }) => `${type} ${name}`).join(',')})`;
    }
    return result;
  }

  //Method to hash dataType; not the data of the data type
  hashDataType(dataType) {
    const oThis = this;

    let encodedDataType = oThis.encodeDataType(dataType);
    return Web3Utils.keccak256(encodedDataType);
  }

  //Method to encode data
  encodeData(dataType, data) {
    const oThis = this;
    let encTypes = [];
    let encValues = [];

    // Add data-type hash
    encTypes.push('bytes32');
    encValues.push(oThis.hashDataType(dataType));

    // Add field contents
    let types = oThis.getTypes();
    let dataTypeProperties = oThis.getDataType(dataType);
    for (let field of dataTypeProperties) {
      let value = data[field.name];
      if (field.type == 'string' || field.type == 'bytes') {
        encTypes.push('bytes32');
        value = Web3Utils.keccak256(value);
        encValues.push(value);
      } else if (types[field.type] !== undefined) {
        encTypes.push('bytes32');
        value = Web3Utils.keccak256(oThis.encodeData(field.type, value));
        encValues.push(value);
      } else if (field.type.lastIndexOf(']') === field.type.length - 1) {
        throw 'Arrays currently unimplemented in encodeData';
      } else {
        encTypes.push(field.type);
        encValues.push(value);
      }
    }

    return Web3Abi.encodeParameters(encTypes, encValues);
  }

  hashData(dataType, data) {
    const oThis = this;

    let encodedData = oThis.encodeData(dataType, data);
    return Web3Utils.keccak256(encodedData);
  }

  getEIP712SignHash() {
    const oThis = this;
    oThis.validate();

    let domainSeparator = oThis.hashData('EIP712Domain', oThis.domain);
    let message = oThis.hashData(oThis.primaryType, oThis.message);

    return Web3Utils.soliditySha3(
      { t: 'bytes', v: oThis.INITIAL_BYTE },
      { t: 'bytes', v: oThis.VERSION },
      { t: 'bytes32', v: domainSeparator },
      { t: 'bytes32', v: message }
    );
  }

  validate() {
    const oThis = this;

    let data = {
      types: oThis.getTypes(),
      primaryType: oThis.getPrimaryType(),
      domain: oThis.getDomain(),
      message: oThis.getMessage()
    };

    let isDataValid = TypedData.validateData(data);
    if (!isDataValid) {
      let err = new Error('TypedData is invalid');
      throw err;
    }
    return isDataValid;
  }

  static validateData(data) {
    let isDataValid = typedDataValidatorFunction(data);
    if (!isDataValid) {
      console.log(typedDataValidatorFunction.errors);
    }
    return isDataValid;
  }

  static fromObject(obj) {
    return new TypedData(obj.types, obj.primaryType, obj.domain, obj.message);
  }
}

module.exports = TypedData;
