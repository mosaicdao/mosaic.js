'use strict';

const Ajv = require('ajv');
const Web3Utils = require('web3-utils');
const Web3Abi = require('web3-eth-abi');

// JSON schema as defined by EIP-712.
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

// Options can be passed, e.g. {allErrors: true}
const typedDataValidatorFunction = (function(schema) {
  const ajv = new Ajv();
  return ajv.compile(schema);
})(TYPED_DATA_JSON_SCHEMA);

const DEFAULT_EIP712_DOMAIN_TYPE = [{ name: 'verifyingContract', type: 'address' }];

/**
 * The class sets attributes/data and signs the data as per EIP712 standard.
 *
 * EIP712 Reference: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md
 * Example Reference: https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
 */
class TypedData {
  /**
   * TypedData class constructor.
   *
   * @param types Types of data. Type e.g. EIP712Domain, StakeRequest etc.
   * @param primaryType Primary type data e.g. StakeRequest.
   * @param domain Domain data e.g. verifyingContract: 'contract address'
   * @param message Message object to sign.
   */
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

  /*
   * Method to set Primary data.
   *
   * @param primaryType Primary data type to set. e.g. StakeRequest.
   */
  setPrimaryType(primaryType) {
    const oThis = this;
    oThis.primaryType = primaryType;
  }

  /**
   * Method to get primary type.
   *
   * @returns {String}
   */
  getPrimaryType() {
    const oThis = this;
    return oThis.primaryType;
  }

  /**
   * Method to set domain data.
   *
   * @param domain Domain data to set.
   *        {
   *            verifyingContract: brandedToken
   *        }
   */
  setDomain(domain) {
    const oThis = this;
    oThis.domain = domain;
  }

  /**
   * Method to get domain data.
   *
   * @returns {String}
   */
  getDomain() {
    const oThis = this;
    return oThis.domain;
  }

  /**
   * Method to set message.
   *
   * @param message Message to set.
   *               {
   *                   staker: stakeRequestObject.staker,
   *                   stake: stakeRequestObject.stakeAmountInWei,
   *                   nonce: stakeRequestObject.nonce
   *                 }
   */
  setMessage(message) {
    const oThis = this;
    oThis.message = message;
  }

  /**
   * Returns message.
   *
   * @returns {Object}
   */
  getMessage() {
    const oThis = this;
    return oThis.message;
  }

  /**
   * Method to set 'types' object as specified in EIP-712.
   *
   * @param types
   *             types: {
   *                      EIP712Domain: [{ name: 'verifyingContract', type: brandedToken }],
   *                      StakeRequest: [
   *                        { name: 'staker', type: 'address' },
   *                        { name: 'stake', type: 'uint256' },
   *                        { name: 'nonce', type: 'uint256' }
   *                    ]
   *                  }
   */
  setTypes(types) {
    const oThis = this;
    types = types || {};
    oThis.types = oThis.types || {};

    Object.assign(oThis.types, types);

    if (!(oThis.types.EIP712Domain instanceof Array)) {
      // Assign the cloned object.
      var clonedEIP712DomainType = Object.assign({}, DEFAULT_EIP712_DOMAIN_TYPE);
      oThis.types.EIP712Domain = clonedEIP712DomainType;
    }
  }

  /**
   * Method to add a particular data-type to the 'types' object.
   *
   * @param dataType e.g. EIP712Domain
   * @param dataTypeProperties e.g. [{ name: 'verifyingContract', type: brandedToken }]
   */
  setDataType(dataType, dataTypeProperties) {
    const oThis = this;
    const types = oThis.types;
    types[dataType] = dataTypeProperties;
  }

  /**
   * Method to get 'types' object.
   *
   * @returns {Object}
   */
  getTypes() {
    const oThis = this;
    return oThis.types;
  }

  /**
   * Method to get dataTypeProperties for a dataType.
   *
   * @param dataType Data type e.g. EIP712Domain
   * @returns {Object} dataTypeProperties set for the dataType.
   */
  getDataForDataType(dataType) {
    const oThis = this;
    return oThis.types[dataType];
  }

  /**
   * Method to get dependencies for a dataType.
   *
   * @param dataType Data type e.g. EIP712Domain.
   * @returns found {Array} Array of dependencies.
   */
  getDataTypeDependencies(dataType, found = []) {
    const oThis = this;

    let types = oThis.types;

    if (found.includes(dataType)) {
      return found;
    }

    let dataTypeProperties = oThis.getDataForDataType(dataType);
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

  /**
   * Encodes all dependencies for a dataType.
   *
   * @param dataType Data type e.g. EIP712Domain.
   * @returns {string} Encoded string
   */
  encodeDataType(dataType) {
    const oThis = this;

    /* Find out dependencies */
    let deps = oThis.getDataTypeDependencies(dataType);
    /*
      Sorting Logic:
      a. Filter out input dataType from dependencies.
      b. Sort the dependencies.
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

  /**
   * Method performs hashing after encoding properties for a dataType.
   *
   * @param dataType Data type e.g. EIP712Domain.
   * @returns {String} encoded => Hashed string
   */
  hashDataType(dataType) {
    const oThis = this;

    let encodedResult = oThis.encodeDataType(dataType);
    return Web3Utils.keccak256(encodedResult);
  }

  /**
   * Performs encoding of data.
   *
   * @param dataType Data type e.g. EIP712Domain.
   * @param data object
   * @returns {*}
   */
  encodeData(dataType, data) {
    const oThis = this;
    let encTypes = [];
    let encValues = [];

    // Add data-type hash.
    encTypes.push('bytes32');
    encValues.push(oThis.hashDataType(dataType));

    // Add field contents.
    let types = oThis.getTypes();
    let dataTypeProperties = oThis.getDataForDataType(dataType);

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

  /**
   * Hash the data after encoding.
   *
   * @param dataType Type of data.
   * @param data data to hash
   * @returns {String} Hashed data.
   */
  hashData(dataType, data) {
    const oThis = this;

    let encodedData = oThis.encodeData(dataType, data);
    return Web3Utils.keccak256(encodedData);
  }

  /**
   * Returns signed hash as per EIP712.
   *
   * @returns {String}
   */
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

  /**
   * Validate the input data.
   *
   * @returns {bool}
   */
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

  /**
   * Validate data static method.
   *
   * @param data Data to validate.
   * @returns {bool} Returns true on success.
   */
  static validateData(data) {
    let isDataValid = typedDataValidatorFunction(data);
    if (!isDataValid) {
      console.log(typedDataValidatorFunction.errors);
    }
    return isDataValid;
  }

  /**
   * Returns TypeData object constructed from input JSON.
   *
   * @param obj Input JSON object.
   */
  static fromObject(obj) {
    return new TypedData(obj.types, obj.primaryType, obj.domain, obj.message);
  }
}

module.exports = TypedData;
