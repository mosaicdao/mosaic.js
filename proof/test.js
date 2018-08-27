const utils = require('ethereumjs-util');

const rootPrefix = '../'
  , ProofGenerator = require(rootPrefix + '/proof/proof_generator');

let chainDataPath = '/Users/kedarchandrayan/openst-setup/openst-geth-utility/geth/chaindata';
let stateRoot = '0xc7040d661055bd559af7a23b4f37f45a00235301408fa46e88475b2cfd94f013';
let index = '1';
let key = '14bb2bf372bbfc1de82d7a80510e8bf9c0735e1982c822f370f0882fc1d4f607';

proofGenerator = new ProofGenerator(stateRoot, chainDataPath);
let contractAddress = '072Ec000E1c181bf5d35e3B84ac7b50a55284173';

proofGenerator.buildAccountProof(contractAddress).then(result => {
  console.log('account Proof result ', result.value);
  console.log('account Proof result ', utils.rlp.decode('0x'+result.value));
});
/*
let buildStorageProof = proofGenerator.buildStorageProof(contractAddress, index, [key]);

buildStorageProof.then((proof) => {

  console.log("Storage Proof  ", proof[key]);
});*/
