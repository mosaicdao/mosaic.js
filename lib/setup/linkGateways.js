const InstanceComposer = require('../../instance_composer'),
  Proof = require('../../tools/proof/proof_generator'),
  HashLock = require('../../utils/HashLock'),
  helper = require('../../utils/helper'),
  Rsync = require('../../tools/sync/sync');

const GATEWAY_NAME = 'Gateway',
  CO_GATEWAY_NAME = 'CoGateway';

/**
 * @notice This service perform 4 step process to link gateway and co-gateway
 * @param gatewayInstance
 * @param coGatewayInstance
 * @param config
 *
 * @constructor
 */

/*
{
 origin:{
   organization:{
     address:"",
     passPhrase:""
   },
   chainDataPath:"",
   coreContractAddress:"",
   outboxPositionIndex:"",
   token:{
      name: "",
      symbol: "",
      decimal: "",
   }
 },
 auxiliary:{
   organization:{
     address:"",
     passPhrase:""
   },
   chainDataPath:""
 }
}
 */
let path = '/Users/sarveshjain/workspace/sj/mosaic.js/mosaic-setup/originChainData/';
const LinkGateways = function(config) {
  const oThis = this;
  oThis.config = config;

  oThis.origin = config.origin;
  oThis.auxiliary = config.auxiliary;

  oThis.token = config.token;

  oThis.originWeb3 = new (oThis.ic().OriginWeb3())();
  oThis.auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis.origin.coreContractAddress);

  const gatewayABI = helper.getABI(GATEWAY_NAME);
  let gatewayTXOptions = {
    from: oThis.origin.deployerAddress,
    gas: oThis.origin.gas,
    gasPrice: oThis.origin.gasPrice
  };
  oThis.gateway = new oThis.originWeb3.eth.Contract(gatewayABI, oThis.origin.gatewayAddress, gatewayTXOptions);

  const coGatewayABI = helper.getABI(CO_GATEWAY_NAME);
  let coGatewayTXOptions = {
    from: oThis.auxiliary.deployerAddress,
    gas: oThis.auxiliary.gas,
    gasPrice: oThis.auxiliary.gasPrice
  };
  oThis.coGateway = new oThis.auxiliaryWeb3.eth.Contract(
    coGatewayABI,
    oThis.auxiliary.coGatewayAddress,
    coGatewayTXOptions
  );

  oThis.auxiliaryCore = new oThis.auxiliaryWeb3.eth.Contract(
    helper.getABI('Core'),
    oThis.auxiliary.coreContractAddress,
    coGatewayTXOptions
  );

  oThis.gasPrice = 1000000000;
  oThis.rsync = new Rsync({ path: oThis.config.origin.chainDataPath }, { path: path });
};

LinkGateways.prototype = {
  link: async function() {
    let oThis = this;

    // await oThis._unlockOrganization(oThis.origin.organization, oThis.originWeb3);
    // await oThis._unlockOrganization(oThis.auxiliary.organization, oThis.auxiliaryWeb3);

    let hashLock = oThis._generateHashLock(),
      senderOrigin = oThis.origin.organization.address,
      senderAuxiliary = oThis.auxiliary.organization.address,
      nonce = await oThis._getNonce(),
      bounty = await oThis._getBounty(),
      intentHash = await oThis._intentHash(bounty, nonce),
      signature = await oThis._signHash(intentHash, nonce, oThis.origin.organization);

    console.log('Initiate Gateway link triggered');

    let receipt = await oThis._initiateGatewayLink(
      oThis.auxiliary.coGatewayAddress,
      intentHash,
      oThis.gasPrice,
      nonce,
      senderOrigin,
      hashLock.l,
      signature,
      bounty
    );

    // console.log('receipt', JSON.stringify(receipt));

    let gatewayLinkInitiatedEvent = receipt.events['GatewayLinkInitiated'];
    if (!gatewayLinkInitiatedEvent) {
      console.log(JSON.stringify(receipt));
      throw 'Initiate gateway link failed';
    }

    let messageHash = gatewayLinkInitiatedEvent.returnValues.messageHash;
    console.log('Message hash generated from initiate gateway link  ', messageHash);

    let blockHeight = receipt.blockNumber,
      stateRoot = await oThis._getStateRoot(blockHeight, oThis.originWeb3);
    console.log(`Committing state root for height ${blockHeight} and state root ${stateRoot}`);

    receipt = await oThis._commitStateRoot(blockHeight, stateRoot);

    let stateRootCommitedEvent = receipt.events['StateRootCommitted'];

    if (!stateRootCommitedEvent) {
      console.log(JSON.stringify(receipt));
      throw 'Commit state Root failed';
    }
    console.log(`Successfully committed stateRoot for block height ${blockHeight}`);
    receipt = await oThis.rsync.perform();
    if (!receipt.statusCode) {
      console.log(JSON.stringify(receipt));
      throw 'Geth chain data sync failed';
    }
    console.log('Geth chain data sync success');

    let proof = new Proof(stateRoot, path + 'chaindata');
    console.log(`Generating account for ${oThis.origin.gatewayAddress.slice(2)}`);
    let gatewayAddress = oThis.origin.gatewayAddress.slice(2),
      gatewayProof = await proof.buildAccountProof(gatewayAddress).catch((error) => {
        console.log(error);
      });

    if (!gatewayProof.value) {
      console.log(JSON.stringify(gatewayProof));
      throw 'Gateway account proof generation failed';
    }
    console.log('Gateway account proof generation done');

    let rlpEncodedAccount = gatewayProof.value,
      rlpParentNodes = gatewayProof.parentNodes;

    console.log('Proving gateway account');
    //for co-gateway
    receipt = await oThis._proveGateway(
      blockHeight,
      rlpEncodedAccount,
      rlpParentNodes,
      oThis.coGateway,
      oThis.auxiliaryWeb3,
      oThis.auxiliary.organization
    );

    let gatewayProvenEvent = receipt.events['GatewayProven'];
    if (!gatewayProvenEvent) {
      console.log(JSON.stringify(gatewayProvenEvent));
      throw 'Prove gateway account failed';
    }
    console.log('Prove gateway done');

    oThis.gatewayOutBoxPosition = '1';

    console.log(`Building message outbox storage proof for message hash ${messageHash}`);

    let storageProof = await proof.buildStorageProof(gatewayAddress, oThis.gatewayOutBoxPosition, [messageHash]);

    if (!storageProof[messageHash].value) {
      console.log(JSON.stringify(storageProof));
      throw 'Storage proof generation failed';
    }
    console.log('Storage proof generation done');

    rlpParentNodes = storageProof[messageHash].parentNodes;
    console.log('Confirming gateway link intent.');
    receipt = await oThis._confirmGatewayLinkIntent(
      intentHash,
      oThis.gasPrice,
      nonce,
      senderOrigin,
      hashLock.l,
      blockHeight,
      rlpParentNodes
    );

    let gatewayLinkConfirmed = receipt.events['GatewayLinkConfirmed'];
    if (!gatewayLinkConfirmed) {
      console.log(JSON.stringify(receipt));
      throw 'Gate link intent confirmation failed';
    }

    console.log('Gateway link intent confirmed');

    oThis.auxiliaryGasPrice = 0;
    oThis.originGasPrice = 10000;

    console.log('Processing gateway link on auxiliary chain');
    receipt = await oThis._processGatewayLink(
      messageHash,
      hashLock.s,
      oThis.coGateway,
      oThis.auxiliaryWeb3,
      oThis.auxiliary.organization,
      oThis.auxiliaryGasPrice
    ); //for co-gateway
    let gatewayLinkProcessed = receipt.events['GatewayLinkProcessed'];

    if (!gatewayLinkProcessed) {
      console.log(JSON.stringify(receipt));
      console.log('Gateway link process failed on auxiliary chain');
    }
    console.log('Processed gateway link on auxiliary chain ');

    console.log('Processing gateway link on origin chain');
    receipt = await oThis._processGatewayLink(
      messageHash,
      hashLock.s,
      oThis.gateway,
      oThis.originWeb3,
      oThis.origin.organization,
      oThis.originGasPrice
    ); //for gateway

    gatewayLinkProcessed = receipt.events['GatewayLinkProcessed'];
    if (!gatewayLinkProcessed) {
      console.log(JSON.stringify(receipt));
      console.log('Gateway link process failed on origin chain');
    }

    console.log('Processed gateway link on origin chain ');

    console.log('*****Gateway Linking Done*****');
  },

  _intentHash: async function(nonce, bounty) {
    const oThis = this;

    return await oThis.gateway.methods
      .hashLinkGateway(
        oThis.origin.gatewayAddress,
        oThis.auxiliary.coGatewayAddress,
        bounty,
        oThis.token.name,
        oThis.token.symbol,
        oThis.token.decimal,
        oThis.gasPrice,
        nonce
      )
      .call({
        from: oThis.origin.organization.address,
        gasPrice: oThis.gasPrice
      });
  },

  _getStateRoot: async function(blockNumber, web3) {
    let block = await web3.eth.getBlock(blockNumber);
    return Promise.resolve(block.stateRoot);
  },

  _getBounty: async function() {
    let oThis = this;

    return await oThis.gateway.methods.bounty().call({
      from: oThis.origin.organization.address,
      gasPrice: oThis.gasPrice
    });
  },

  _getNonce: async function() {
    let oThis = this;
    return await oThis.gateway.methods.getNonce(oThis.origin.organization.address).call({
      from: oThis.origin.organization.address,
      gasPrice: oThis.gasPrice
    });
  },

  _signHash: async function(hash, nonce, organization) {
    const oThis = this;
    let typeHash = await oThis.gateway.methods.gatewayLinkTypeHash().call({
      from: oThis.origin.organization.address,
      gasPrice: oThis.gasPrice
    });
    let digest = oThis.originWeb3.utils.soliditySha3(
      { t: 'bytes32', v: typeHash },
      { t: 'bytes32', v: hash },
      { t: 'uint256', v: nonce },
      { t: 'uint256', v: oThis.gasPrice }
    );
    //todo remove unlock when signer supports sign data
    await oThis._unlockOrganization(oThis.origin.organization, oThis.originWeb3);
    return await oThis.originWeb3.eth.sign(digest, organization.address);
  },

  _unlockOrganization: async function(organization, web3) {
    await web3.eth.personal.unlockAccount(organization.address, organization.passPhrase);
  },

  _generateHashLock: function() {
    let hs = new HashLock();
    return hs.getHashLock();
  },

  _initiateGatewayLink: async function(
    coGatewayAddress,
    intentHash,
    gasPrice,
    nonce,
    sender,
    hashLock,
    signature,
    bounty
  ) {
    let oThis = this;

    // await oThis._unlockOrganization(oThis.origin.organization, oThis.originWeb3);

    return oThis.gateway.methods
      .initiateGatewayLink(coGatewayAddress, intentHash, gasPrice, nonce, sender, hashLock, signature)
      .send({
        from: sender,
        gasPrice: 0,
        gas: 4700000
      })
      .once('error', function(error) {
        Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        Promise.resolve(receipt);
      })
      .once('transactionHash', function(transactionHash) {
        console.log('transactionHash: ', transactionHash);
      });
  },

  _confirmGatewayLinkIntent: async function(
    intentHash,
    gasPrice,
    nonce,
    sender,
    hashLock,
    blockHeight,
    rlpParentNodes
  ) {
    let oThis = this;

    // await oThis._unlockOrganization(oThis.auxiliary.organization,
    // oThis.auxiliaryWeb3);
    let txObj = oThis.coGateway.methods.confirmGatewayLinkIntent(
      intentHash,
      gasPrice,
      nonce,
      sender,
      hashLock,
      blockHeight,
      '0x' + rlpParentNodes
    );
    return await txObj
      .send({
        from: oThis.auxiliary.organization.address,
        gasPrice: 0,
        gas: 4700000
      })
      .once('error', function(error) {
        return Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        return Promise.resolve(receipt);
      })
      .once('transactionHash', function(transactionHash) {
        console.log('Transaction hash ', transactionHash);
      });
  },

  /**
   *
   * @param blockHeight
   * @param rlpEncodedAccount
   * @param rlpParentNodes
   * @param gatewayInstance
   * @param web3
   * @param organization
   * @return {Promise<any>}
   */
  _proveGateway: async function(blockHeight, rlpEncodedAccount, rlpParentNodes, gatewayInstance, web3, organization) {
    // await oThis._unlockOrganization(organization, web3);

    let accountValue = '0x' + rlpEncodedAccount;

    return await gatewayInstance.methods
      .proveGateway(blockHeight, accountValue, '0x' + rlpParentNodes)
      .send({
        from: organization.address,
        gasPrice: 0,
        gas: 470000
      })
      .once('error', function(error) {
        return Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        Promise.resolve(receipt);
      })
      .once('transactionHash', function(transactionHash) {
        console.log('Transaction hash ', transactionHash);
      });
  },

  /**
   * This method will be called for both gateway and co-gateway
   * @param messageHash
   * @param unlockSecret
   * @param gatewayInstance
   * @param web3
   * @param organization
   * @return {Promise<any>}
   */
  _processGatewayLink: async function(messageHash, unlockSecret, gatewayInstance, web3, organization, gasPrice) {
    //await oThis._unlockOrganization(organization, web3);

    return await gatewayInstance.methods
      .processGatewayLink(messageHash, unlockSecret)
      .send({
        from: organization.address,
        gasPrice: gasPrice,
        gas: 470000
      })
      .once('error', function(error) {
        return Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        return Promise.resolve(receipt);
      })
      .once('transactionHash', function(transactionHash) {
        console.log('Transaction hash  ', transactionHash);
      });
  },

  _commitStateRoot: async function(blockHeight, stateRoot) {
    let oThis = this;

    //await
    // oThis.auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxiliary.workerAddress, 'testtest');

    return await oThis.auxiliaryCore.methods
      .commitStateRoot(blockHeight, stateRoot)
      .send({
        from: oThis.auxiliary.workerAddress,
        gasPrice: '0x0',
        gas: 4700000
      })
      .once('error', function(error) {
        Promise.reject(error);
      })
      .once('receipt', function(receipt) {
        Promise.resolve(receipt);
      })
      .once('transactionHash', function(transactionHash) {
        console.log('transactionHash: ', transactionHash);
      });
  }
};

InstanceComposer.registerShadowableClass(LinkGateways, 'LinkGateways');

module.exports = LinkGateways;
