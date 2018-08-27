const rootPrefix = '..',
  AccountProof = require(rootPrefix + '/proof/lib/account_proof'),
  StorageProof = require(rootPrefix + '/proof/lib/storage_proof'),
  dbFactory = require(rootPrefix + '/proof/lib/leveldb'),
  helper = require(rootPrefix + '/proof/lib/helper');

/**
 * @param stateRoot
 * @param chainDataPath
 * @constructor
 */
function ProofGenerator(stateRoot, chainDataPath) {
  const oThis = this;

  oThis.db = dbFactory.getInstance(chainDataPath);
  oThis.stateRoot = stateRoot;
}

ProofGenerator.prototype = {
  buildAccountProof: function(address) {
    const oThis = this;

    let accountProof = new AccountProof(oThis.stateRoot, oThis.db);
    return accountProof.perform(address);
  },

  /**
   * @param contractAddress
   * @param storageIndex Position of variable in the contract
   * @param mappingKeys array of keys of mapping variable in the contract
   * @Optional param  key for mapping variable type
   * @return {*|Promise<map<key,proof>} in batch mode and Promise<proof> in non batch mode i.e. single non-mapping type variable
   */

  buildStorageProof: async function(contractAddress, storageIndex, mappingKeys) {
    const oThis = this;
    let keyProofMap = {};

    let storageRoot = await helper.fetchStorageRoot(oThis.stateRoot, contractAddress, oThis.db),
      storageProof = new StorageProof(storageRoot, contractAddress, oThis.db);

    if (mappingKeys === undefined || mappingKeys.length === 0) {
      let proof = await storageProof.perform(storageIndex);
      return Promise.resolve(proof);
    }
    for (let i = 0; i < mappingKeys.length; i++) {
      keyProofMap[mappingKeys[i]] = await storageProof.perform(storageIndex, mappingKeys[i]);
    }

    return keyProofMap;
  }
};

module.exports = ProofGenerator;
