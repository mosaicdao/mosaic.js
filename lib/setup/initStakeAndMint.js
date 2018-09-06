const InstanceComposer = require('../../instance_composer'),
  HashLock = require('../../utils/HashLock'),
  Proof = require('../../tools/proof/proof_generator'),
  Rsync = require('../../tools/sync/sync');

const path = '/Users/deepeshkn/Documents/workspace/kedarchandrayan/mosaic.js/mosaic-setup/originChainData/';

const ORIGIN_GAS_PRICE = 0,
  ORIGIN_GAS_LIMIT = 4700000,
  AUXILIARY_GAS_PRICE = 0,
  AUXLILIARY_GAS_LIMIT = 4700000,
  PASSPHRASE = 'testtest';

const StakeAndMint = function(config) {
  const oThis = this;

  oThis.config = config;
  oThis.gatewayAddress = config.gatewayAddress;
  oThis.coGatewayAddress = config.coGatewayAddress;
  oThis.originCoreAddress = config.originCoreContractAddress;
  oThis.originFacilitator = config.originDeployerAddress;
  oThis.auxiliaryFacilitator = config.auxiliaryDeployerAddress;

  oThis.originOptions = {
    from: oThis.originFacilitator,
    gas: ORIGIN_GAS_LIMIT,
    gasPrice: ORIGIN_GAS_PRICE
  };

  oThis.auxiliaryOptions = {
    from: oThis.auxiliaryFacilitator,
    gas: AUXLILIARY_GAS_LIMIT,
    gasPrice: AUXILIARY_GAS_PRICE
  };

  const ERC20Gateway = oThis.ic().ERC20Gateway(),
    MockToken = oThis.ic().MockToken(),
    Core = oThis.ic().Core();

  oThis.erc20Gateway = new ERC20Gateway(
    oThis.gatewayAddress,
    oThis.originOptions,
    oThis.originCoreAddress,
    oThis.coGatewayAddress,
    oThis.auxiliaryOptions
  );

  oThis.mockToken = new MockToken(
    config.originERC20TokenContractAddress,
    {
      from: config.originDeployerAddress,
      gas: ORIGIN_GAS_LIMIT,
      gasPrice: ORIGIN_GAS_PRICE
    },
    config.originCoreContractAddress
  );

  oThis.core = new Core(
    config.originCoreContractAddress,
    {
      from: config.originWorkerAddress,
      gas: ORIGIN_GAS_LIMIT,
      gasPrice: ORIGIN_GAS_PRICE
    },
    config.auxiliaryCoreContractAddress,
    {
      from: config.auxiliaryWorkerAddress,
      gas: AUXLILIARY_GAS_LIMIT,
      gasPrice: AUXILIARY_GAS_PRICE
    }
  );

  oThis.rsync = new Rsync({ path: config.originChainDataPath }, { path: config.originChainDataSyncPath });
};

StakeAndMint.prototype = {
  perform: async function() {
    const oThis = this;

    const stakeAmount = 100000000000000,
      staker = oThis.config.originDeployerAddress,
      beneficiary = oThis.config.auxiliaryOrganizationAddress,
      gasPrice = 100;

    console.log(`Approving Gateway for ${stakeAmount} by staker ${staker}`);
    let approveResponse = await oThis._approve(oThis.gatewayAddress, stakeAmount, staker);
    console.log(`Approve Gateway done`);

    let nonce = await oThis._getNonce(staker);
    console.log('nonce: ', nonce);

    let intentHash = await oThis._intentHash(stakeAmount, beneficiary, staker, gasPrice);
    console.log('intentHash: ', intentHash);

    let hashLock = oThis._generateHashLock();
    console.log('hashLock: ', hashLock);

    const signature = await oThis._signHash(intentHash, nonce, staker);
    console.log('signature: ', signature);

    const bounty = await oThis._getBounty();
    console.log('bounty: ', bounty);

    const messageHash = await oThis._stakeCall(
      stakeAmount,
      beneficiary,
      staker,
      gasPrice,
      nonce,
      hashLock.l,
      signature,
      bounty
    );
    console.log('messageHash: ', messageHash);

    const stakeResponse = await oThis._stake(
      stakeAmount,
      beneficiary,
      staker,
      gasPrice,
      nonce,
      hashLock.l,
      signature,
      bounty
    );
    console.log('stakeResponse: ', stakeResponse);

    let originWeb3 = new (oThis.ic().OriginWeb3())();
    const stateRoot = await oThis._getStateRoot(stakeResponse, originWeb3);
    console.log('stateRoot: ', stateRoot);

    const commitStateRootResponse = await oThis._commitStateRootOnAuxiliary(stakeResponse.blockNumber, stateRoot);
    console.log('commitStateRootResponse: ', commitStateRootResponse);

    await oThis.rsync.perform();
    console.log('RSYNC done, generating proof');

    let proof = new Proof(stateRoot, path + 'chaindata');

    let gatewayProof = await proof.buildAccountProof(oThis.gatewayAddress.slice(2)).catch((error) => {
      console.log('gatewayProof error: ', error);
    });

    console.log('gatewayProof: ', gatewayProof);

    let rlpEncodedAccount = gatewayProof.value,
      rlpParentNodes = gatewayProof.parentNodes;

    console.log('calling _proveGateway: ');
    const proveGateway = await oThis._proveGateway(stakeResponse.blockNumber, rlpEncodedAccount, rlpParentNodes);
    console.log('proveGateway: ', proveGateway);

    oThis.gatewayOutBoxPosition = '1';

    console.log(`Building message outbox storage proof for message hash ${messageHash}`);

    let storageProof = await proof.buildStorageProof(oThis.gatewayAddress.slice(2), oThis.gatewayOutBoxPosition, [
      messageHash
    ]);

    console.log('storageProof: ', storageProof);

    rlpParentNodes = storageProof[messageHash].parentNodes;

    let confirmStakingIntentHashResponse = await oThis._confirmStakingIntentHash(
      staker,
      nonce,
      beneficiary,
      stakeAmount,
      gasPrice,
      stakeResponse.blockNumber,
      hashLock.l,
      rlpParentNodes
    );
    console.log('confirmStakingIntentHashResponse: ', confirmStakingIntentHashResponse);

    const processStakingResponse = await oThis._processStaking(messageHash, hashLock.s);
    console.log('processStakingResponse: ', processStakingResponse);

    const processMintingResponse = await oThis._processMinting(messageHash, hashLock.s);
    console.log('processMintingResponse: ', processMintingResponse);
  },

  _getMosaicConfig: function(configs) {
    return {
      origin: {
        provider: configs.originGethRpcEndPoint
      },
      auxiliaries: [
        {
          provider: configs.auxiliaryGethRpcEndPoint,
          originCoreContractAddress: configs.originCoreContractAddress
        }
      ]
    };
  },

  _signHash: async function(hash, nonce, signer) {
    const oThis = this;

    let typeHash = await oThis.erc20Gateway.origin.stakeRequestTypeHash().call({
      from: oThis.originFacilitator,
      gas: 4700000,
      gasPrice: 1000
    });

    let originWeb3 = new (oThis.ic().OriginWeb3())();

    let digest = originWeb3.utils.soliditySha3(
      { t: 'bytes32', v: typeHash },
      { t: 'bytes32', v: hash },
      { t: 'uint256', v: nonce },
      { t: 'uint256', v: 100 }
    );

    return await originWeb3.eth.sign(digest, signer);
  },

  _approve: async function(address, amount, sender) {
    // approve gateway
    const oThis = this;

    // unlock account
    await oThis._unlockAccountOnOrigin(sender, PASSPHRASE);

    return oThis.mockToken.origin
      .approve(address, amount)
      .send({
        from: sender,
        gas: 4700000,
        gasPrice: 1000
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

  _getNonce: async function(address) {
    const oThis = this;
    const nonce = await oThis.erc20Gateway.origin.getNonce(address).call({
      from: oThis.config.originDeployerAddress,
      gas: ORIGIN_GAS_LIMIT,
      gasPrice: ORIGIN_GAS_PRICE
    });
    return nonce;
  },

  _getBounty: async function() {
    const oThis = this;
    const bounty = await oThis.erc20Gateway.origin.bounty().call({
      from: oThis.config.originDeployerAddress,
      gas: ORIGIN_GAS_LIMIT,
      gasPrice: ORIGIN_GAS_PRICE
    });
    return bounty;
  },

  _intentHash: async function(stakeAmount, beneficiary, staker, gasPrice) {
    const oThis = this;
    const intentHash = await oThis.erc20Gateway.origin
      .hashStakingIntent(stakeAmount, beneficiary, staker, gasPrice)
      .call({
        from: oThis.config.originDeployerAddress,
        gas: ORIGIN_GAS_LIMIT,
        gasPrice: ORIGIN_GAS_PRICE
      });
    return intentHash;
  },

  _generateHashLock: function() {
    let hs = new HashLock();
    return hs.getHashLock();
  },

  _stakeCall: async function(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature, bounty) {
    const oThis = this;

    let stakeResponse = await oThis.erc20Gateway
      .stake(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature)
      .call({
        from: oThis.originFacilitator,
        gas: ORIGIN_GAS_LIMIT,
        gasPrice: ORIGIN_GAS_PRICE,
        value: bounty
      });

    return stakeResponse;
  },

  _stake: async function(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature, bounty) {
    const oThis = this;

    // unlock account
    await oThis._unlockAccountOnOrigin(oThis.originFacilitator, PASSPHRASE);

    return oThis.erc20Gateway
      .stake(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature)
      .send({
        from: oThis.originFacilitator,
        gas: ORIGIN_GAS_LIMIT,
        gasPrice: ORIGIN_GAS_PRICE,
        value: bounty
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

  _processStaking: async function(messageHash, unlockSecret) {
    const oThis = this;

    // unlock account
    await oThis._unlockAccountOnAuxiliary(oThis.auxiliaryFacilitator, PASSPHRASE);

    return oThis.erc20Gateway
      .processStaking(messageHash, unlockSecret)
      .send({
        from: oThis.originFacilitator,
        gas: AUXLILIARY_GAS_LIMIT,
        gasPrice: AUXILIARY_GAS_PRICE
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

  _getStateRoot: async function(receipt, web3) {
    const oThis = this;
    let block = await web3.eth.getBlock(receipt.blockNumber);
    return block.stateRoot;
  },

  _commitStateRootOnAuxiliary: async function(blockHeight, stateRoot) {
    let oThis = this;

    // unlock account
    await oThis._unlockAccountOnAuxiliary(oThis.auxiliaryFacilitator, PASSPHRASE);

    return oThis.core.auxiliary
      .commitStateRoot(blockHeight, stateRoot)
      .send({
        from: oThis.config.auxiliaryWorkerAddress,
        gas: AUXLILIARY_GAS_LIMIT,
        gasPrice: AUXILIARY_GAS_PRICE
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

  _proveGateway: async function(blockHeight, rlpEncodedAccount, rlpParentNodes) {
    const oThis = this;

    // unlock account
    await oThis._unlockAccountOnAuxiliary(oThis.auxiliaryFacilitator, PASSPHRASE);

    return oThis.erc20Gateway.auxiliary
      .proveGateway(blockHeight, rlpEncodedAccount, rlpParentNodes)
      .send({
        from: oThis.config.auxiliaryWorkerAddress,
        gas: AUXLILIARY_GAS_LIMIT,
        gasPrice: AUXILIARY_GAS_PRICE
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

  _confirmStakingIntentHash: async function(
    staker,
    stakerNonce,
    beneficiary,
    amount,
    gasPrice,
    blockHeight,
    hashLock,
    rlpParentNodes
  ) {
    const oThis = this;

    // unlock account
    await oThis._unlockAccountOnAuxiliary(oThis.auxiliaryFacilitator, PASSPHRASE);

    return oThis.erc20Gateway
      .confirmStakingIntent(staker, stakerNonce, beneficiary, amount, gasPrice, blockHeight, hashLock, rlpParentNodes)
      .send({
        from: oThis.auxiliaryFacilitator,
        gas: AUXLILIARY_GAS_LIMIT,
        gasPrice: AUXILIARY_GAS_PRICE
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

  _processMinting: async function(messageHash, unlockSecret) {
    const oThis = this;

    // unlock account
    await oThis._unlockAccountOnAuxiliary(oThis.auxiliaryFacilitator, PASSPHRASE);

    return oThis.erc20Gateway
      .processMinting(messageHash, unlockSecret)
      .send({
        from: oThis.auxiliaryFacilitator,
        gas: AUXLILIARY_GAS_LIMIT,
        gasPrice: AUXILIARY_GAS_PRICE
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

  _unlockAccountOnOrigin: async function(account, passphrase) {
    const oThis = this;
    let originWeb3 = new (oThis.ic().OriginWeb3())();
    await originWeb3.eth.personal.unlockAccount(account, passphrase);
  },

  _unlockAccountOnAuxiliary: async function(account, passphrase) {
    const oThis = this;
    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis.originCoreAddress);
    await auxiliaryWeb3.eth.personal.unlockAccount(account, passphrase);
  }
};

InstanceComposer.registerShadowableClass(StakeAndMint, 'StakeAndMint');

module.exports = StakeAndMint;
