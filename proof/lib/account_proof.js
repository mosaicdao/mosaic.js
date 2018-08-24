const Trie = require('merkle-patricia-tree');

const rootPrefix = "../.."
  , proof = require(rootPrefix + "/proof/lib/proof")
;

/**
 * @constructor
 * @param stateRoot
 * @param db
 */
function AccountProof(stateRoot, db) {
  const oThis = this;

  oThis.trie = new Trie(db, stateRoot);
}

AccountProof.prototype = {

  /**
   * Validate and _build proof
   * @param address
   * @return {Promise<proof>}
   */
  perform: async function (address) {
    const oThis = this;

    await oThis._validate(address);
    return oThis._build(address);
  },
  /**
   * Delegates call to _build account proof to lib
   * @param address
   * @return {Promise<proof>}
   */
  _build: async function (address) {
    const oThis = this;

    return proof.accountProof(address, oThis.trie);
  },
  /**
   * Validate input
   * @param address
   * @private
   */
  _validate: async function (address) {
    const oThis = this;

    if (!oThis.trie || oThis.trie.root === oThis.trie.EMPTY_TRIE_ROOT) {
      return Promise.reject({"error": "tree_not_initialized"});
    }
    if (address === undefined) {
      return Promise.reject({"error": "account_address_undefined"});
    }
  }
};

module.exports = AccountProof;

