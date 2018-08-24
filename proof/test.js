const rootPrefix = '../'
  , ProofGenerator = require(rootPrefix + '/proof/proof_generator');

let chainDataPath = '/Users/sarveshjain/workspace/openst-payments/mocha_test/scripts/st-poa-backup/geth/chaindata';
let stateRoot = '0x8060690a0ab1c3c2ee84d59f2856fa6854bcd8c6c974bee3d08c50fae2128421';
let index = '1';
let key = '14bb2bf372bbfc1de82d7a80510e8bf9c0735e1982c822f370f0882fc1d4f607';

proofGenerator = new ProofGenerator(stateRoot, chainDataPath);
let contractAddress = 'f60C58706CB1242092609041d077d996b76b4482';

proofGenerator.buildAccountProof(contractAddress).then(result => {
  console.log('account Proof result ', result);
});

let buildStorageProof = proofGenerator.buildStorageProof(contractAddress, index, [key]);

buildStorageProof.then((proof) => {

  console.log("Storage Proof  ", proof[key]);
});
