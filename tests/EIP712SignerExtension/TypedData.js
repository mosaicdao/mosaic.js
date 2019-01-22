'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  Package = require('../../index'),
  TypedData = Package.Utils.EIP712TypedData,
  assert = chai.assert;

const config = require('../../tests/utils/configReader'),
  Web3WalletHelper = require('../../tests/utils/Web3WalletHelper');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

// Testing Data taken from
// https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
const TypedDataInput = {
  types: {
    EIP712Domain: [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ],
    Person: [{ name: 'name', type: 'string' }, { name: 'wallet', type: 'address' }],
    Mail: [{ name: 'from', type: 'Person' }, { name: 'to', type: 'Person' }, { name: 'contents', type: 'string' }]
  },
  primaryType: 'Mail',
  domain: {
    name: 'Ether Mail',
    version: '1',
    chainId: 1,
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC'
  },
  message: {
    from: {
      name: 'Cow',
      wallet: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826'
    },
    to: {
      name: 'Bob',
      wallet: '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB'
    },
    contents: 'Hello, Bob!'
  }
};

// Expected Outputs - as specified in https://github.com/ethereum/EIPs/blob/master/assets/eip-712/Example.js
const EncodedMailType = 'Mail(Person from,Person to,string contents)Person(string name,address wallet)';
const MailTypeHash = '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2';
const EncodedMessageData =
  '0xa0cedeb2dc280ba39b857546d74f5549c3a1d7bdc2dd96bf881f76108e23dac2fc71e5fa27ff56c350aa531bc129ebdf613b772b6604664f5d8dbe21b85eb0c8cd54f074a4af31b4411ff6a60c9719dbd559c221c8ac3492d9d872b041d703d1b5aadf3154a261abdd9086fc627b61efca26ae5702701d05cd2305f7c52a2fc8';
const MessageDataHash = '0xc52c0ee5d84264471806290a3f2c4cecfc5490626bf912d01f240d7a274b371e';
const EIP712DomainDataHash = '0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f';
const SignHash = '0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2';
const SignerAddress = web3.utils.toChecksumAddress('0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826');
const ExpectedSignature = {
  messageHash: SignHash,
  v: web3.utils.toHex(28),
  r: '0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d',
  s: '0x07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b91562',
  signature:
    '0x4355c47d63924e8a72e509b65029052eb6c299d53a04e167c5775fd466751c9d07299936d304c153f6443dfa05f40ff007d72911b6f72307f996231605b915621c'
};

let _types, _primaryType, _domain, _message;

describe('tests/EIP712SignerExtension/TypedData', function() {
  //Load keys
  before(function() {
    this.timeout(60 * 1000);
    return web3WalletHelper.init(web3);
  });

  it('should be a valid typedData', function() {
    assert.isTrue(TypedData.validateData(TypedDataInput), 'TypedDataInput validation failed');
  });

  let typedData1 = TypedData.fromObject(TypedDataInput);
  commonTestCases(typedData1, 'Testing typedData1 which uses TypedData.fromObject');

  let _types = Object.assign({}, TypedDataInput.types);
  let _primaryType = String(TypedDataInput.primaryType);
  let _domain = Object.assign({}, TypedDataInput.domain);
  let _message = Object.assign({}, TypedDataInput.message);

  let typedData2 = new TypedData(_types, _primaryType, _domain, _message);
  commonTestCases(typedData2, 'Testing typedData2 which uses constructor');

  _types = Object.assign({}, TypedDataInput.types);
  _primaryType = String(TypedDataInput.primaryType);
  _domain = Object.assign({}, TypedDataInput.domain);
  _message = Object.assign({}, TypedDataInput.message);

  let personDataType = TypedDataInput.types.Person;
  let mailDataType = TypedDataInput.types.Mail;
  let domainDataType = TypedDataInput.types.EIP712Domain;

  let typedData3 = new TypedData();
  typedData3.setDataType('EIP712Domain', domainDataType);
  typedData3.setDataType('Mail', mailDataType);
  typedData3.setDataType('Person', personDataType);
  typedData3.setPrimaryType(_primaryType);
  typedData3.setDomain(_domain);
  typedData3.setMessage(_message);
  commonTestCases(typedData3, 'Testing typedData3 which uses setDataType');

  it('web3 wallet should sign hash correctly', function() {
    let privateKey = web3.utils.sha3('cow');
    let account = web3.eth.accounts.privateKeyToAccount(privateKey);
    let signature = account.signEIP712TypedData(TypedDataInput);
    assert.deepEqual(signature, ExpectedSignature, 'Invalid signature (signEIP712TypedData with TypedDataInput)');
  });
});

function commonTestCases(typedData, displayMessage) {
  it('should be an instanceof TypedData', function() {
    displayMessage && console.log(displayMessage);
    assert.instanceOf(typedData, TypedData);
  });

  it('should be a valid typedData', function() {
    assert.isTrue(typedData.validate(), 'typedData is invalid.');
  });

  it('should encode "Mail" data-type correctly', function() {
    let encodedType = typedData.encodeDataType('Mail');
    assert.strictEqual(encodedType, EncodedMailType, 'DataType encoding is incorrect.');
  });

  it('should hash "Mail" data-type correctly', function() {
    let hashedType = typedData.hashDataType('Mail');
    assert.strictEqual(hashedType, MailTypeHash, 'DataType hash is incorrect.');
  });

  it('should encode message correctly', function() {
    let _primaryType = String(TypedDataInput.primaryType);
    let _message = Object.assign({}, TypedDataInput.message);
    let encodedData = typedData.encodeData(_primaryType, _message);
    assert.strictEqual(encodedData, EncodedMessageData, 'Message encoding is incorrect.');
  });

  it('should hash message correctly', function() {
    let _primaryType = String(TypedDataInput.primaryType);
    let _message = Object.assign({}, TypedDataInput.message);
    let hashedMessage = typedData.hashData(_primaryType, _message);
    assert.strictEqual(hashedMessage, MessageDataHash, 'Message hash is incorrect.');
  });

  it('should hash domain correctly', function() {
    let _dataType = 'EIP712Domain';
    let _domain = Object.assign({}, TypedDataInput.domain);
    let hashedData = typedData.hashData(_dataType, _domain);
    assert.strictEqual(hashedData, EIP712DomainDataHash, 'Doamin hash is incorrect.');
  });

  it('should return signHash correctly', function() {
    let signHash = typedData.getEIP712SignHash();
    assert.strictEqual(signHash, SignHash, 'signHash is incorrect');
  });

  it('web3 wallet should sign hash correctly', function() {
    let privateKey = web3.utils.sha3('cow');
    let account = web3.eth.accounts.privateKeyToAccount(privateKey);
    // Why private key is missing.
    let signature = account.signEIP712TypedData(typedData);
    assert.deepEqual(signature, ExpectedSignature, 'Invalid signature (signEIP712TypedData)');
  });
}

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
