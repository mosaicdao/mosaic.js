const InstanceComposer = require('../../instance_composer');
const HashLock = require('../../utils/HashLock');
const Proof = require('../../tools/proof/proof_generator');
const Rsync = require('../../tools/sync/sync');

const path = '/Users/deepeshkn/Documents/workspace/kedarchandrayan/mosaic.js/mosaic-setup/originChainData/';

const StakeAndMint = function(config) {
  console.log('config: ', config);
  const oThis = this;

  oThis.config = config;

  oThis.gatewayAddress = config.gatewayAddress;
  oThis.coGatewayAddress = config.coGatewayAddress;
  oThis.originCoreAddress = config.originCoreContractAddress;

  oThis.originFacilitator = config.originDeployerAddress;
  oThis.auxiliaryFacilitator = config.auxiliaryDeployerAddress;

  oThis.originOptions = {
    from: oThis.originFacilitator,
    gas: 4700000,
    gasPrice: 0
  };

  oThis.auxiliaryOptions = {
    from: oThis.auxiliaryFacilitator,
    gas: 4700000,
    gasPrice: 0
  };

  const ERC20Gateway = oThis.ic().ERC20Gateway();
  const MockToken = oThis.ic().MockToken();
  const Core = oThis.ic().Core();

  console.log('ERC20Gateway: ', ERC20Gateway);
  console.log('MockToken: ', MockToken);

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
      gas: 4700000,
      gasPrice: 0
    },
    config.originCoreContractAddress
  );

  oThis.core = new Core(
    config.originCoreContractAddress,
    {
      from: config.originWorkerAddress,
      gas: 4700000,
      gasPrice: 0
    },
    config.auxiliaryCoreContractAddress,
    {
      from: config.auxiliaryWorkerAddress,
      gas: 4700000,
      gasPrice: 0
    }
  );

  oThis.rsync = new Rsync({ path: config.originChainDataPath }, { path: path });
};

StakeAndMint.prototype = {
  perform: async function() {
    const oThis = this;

    const stakeAmount = 100000000000000,
      staker = oThis.config.originDeployerAddress,
      beneficiary = oThis.config.auxiliaryOrganizationAddress,
      gasPrice = 100;

    let approveResponse = await oThis._approve(oThis.gatewayAddress, stakeAmount, staker);
    console.log('approveResponse: ', approveResponse);

    let nonce = await oThis._getNonce(staker);
    console.log('nonce: ', nonce);

    let intentHash = await oThis._intentHash(stakeAmount, beneficiary, staker, gasPrice);
    console.log('intentHash: ', intentHash);

    let hashLock = oThis._generateHashLock();
    console.log('hashLock: ', hashLock);

    const signature = await oThis._signHash(intentHash, nonce, staker);
    console.log('signature: ', signature);

    const messageHash = await oThis._stakeCall(
      stakeAmount,
      beneficiary,
      staker,
      gasPrice,
      nonce,
      hashLock.l,
      signature
    );
    console.log('messageHash: ', messageHash);

    const stakeResponse = await oThis._stake(stakeAmount, beneficiary, staker, gasPrice, nonce, hashLock.l, signature);
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

    /*

      let staker =  "0xb6ee82c5f8561ceb8f5eb664d40129d6e35f5ec9";
      let stakerNonce =  0;
      let beneficiary =  "0xfecd9ca274c77bf2b4d9857b41a23ba5e777b677";
      let amount =  100;
      let gasPrice =  100;
      let blockHeight =  3037;
      let hashLock =  "0x57489f7c39488ab839bab8ac66d6af11687622213dec002b7f40e9be99c2acf9";
      let rlpParentNodes =  "0xf901f7f901d1a02d376448449b3de74d99d8a5aae08380b9c807ab67e6c3c0d2ab82515147b72a80a08fc9d7351344cef877057dfdb90ecaf0146684a887bbb3824e60f0ddf53030b6a0029df6144bbe8de38b62f4670cad6abd057aa497ca30997b15b954342b820da7a0e0558bcd53bb4bdb02ff310937138c44448bb3ecde4ef8786bb1e3dba09134e5a0272cc77e5954b44e7028adb11b2438e372c9274eeb0c62a37468c4563a9ff29ba006c2bd4a70ff6fe41b7460b57121ea239880179f413a92305d8a56cabbd73720a015efcf5ac961378875481ddbadd5607d9dc6700d57d092da993db805183caf76a0b552b4695ecd17c391f046bbc3d2984d8c3cf512eb4e9dbf13fff488b8f7d15f80a04a3d04b53f10629a45c72f3434a1b3756c502b6f11079bcb6d58eeb24df12d87a0e2d32630cef47f57b8181b3447560e16ffb8918d66dd6954cfa875d8c384b8f8a055efc4c23c472f077630316c4a92665fa599fab213cd5b71ca7505808120ed96a015ea050b088ee4f335ab51c9a755c8f286be099e5ef9d87a924dacc265aaee4ea0a7cc9f8173597eea51aee31edb242591e26fc0af6f5d36aece47d609e107e559a0bbef8aac52610e36c857def22e0303f03bbe6988a56882f30e6ea92fbc29b1c080e2a0329691fcf102f8d9a5cc47b164dfcf6a568ad612b8347f76da9dc56837c8aefa01";



      let confirmStakingIntentHashResponse = await oThis._confirmStakingIntentHash(staker, stakerNonce, beneficiary, amount, gasPrice, blockHeight, hashLock, rlpParentNodes);
     */

    //rlpParentNodes = storageProof[messageHash].parentNodes;

    // const stakeRequestAmount_ = await oThis._processStakingCall(messageHash, hashLock.s);
    // console.log('stakeRequestAmount_: ', stakeRequestAmount_);

    // oThis.mockToken.approve(oThis.gatewayAddress);

    // stake;

    // let stakeResult = await oThis.stake(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature);
    //
    // let confirmStakingIntentResult = await oThis.confirmStakingIntent();
    //
    // let processStakingResult = await oThis.processStaking();
    //
    // let processMintingResult = await oThis.processMinting();
  },

  confirmStakingIntent: async function() {},

  processMinting: async function() {},

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
  /*_setSigner: function() {
        //We will use the geth Signer here.
        let oThis = this,
            mosaic = oThis.mosaic;

        let originGethSigner = new mosaic.utils.GethSignerService(mosaic.origin());
        originGethSigner.addAccount(oThis.config.originDeployerAddress, 'testtest');

        mosaic.signers.setOriginSignerService(originGethSigner);
    },
    */

  _approve: async function(address, amount, sender) {
    // approve gateway
    const oThis = this;
    let approveResponse = await oThis.mockToken.origin.approve(address, amount).send({
      from: sender,
      gas: 4700000,
      gasPrice: 1000
    });
    return approveResponse;
  },

  _getNonce: async function(address) {
    const oThis = this;
    const nonce = await oThis.erc20Gateway.origin.getNonce(address).call({
      from: oThis.config.originDeployerAddress,
      gas: 4700000,
      gasPrice: 1000
    });
    return nonce;
  },

  _intentHash: async function(stakeAmount, beneficiary, staker, gasPrice) {
    const oThis = this;
    const intentHash = await oThis.erc20Gateway.origin
      .hashStakingIntent(stakeAmount, beneficiary, staker, gasPrice)
      .call({
        from: oThis.config.originDeployerAddress,
        gas: 4700000,
        gasPrice: 1000
      });
    return intentHash;
  },

  _generateHashLock: function() {
    let hs = new HashLock();
    return hs.getHashLock();
  },

  _stakeCall: async function(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature) {
    const oThis = this;

    let stakeResponse = await oThis.erc20Gateway
      .stake(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature)
      .call({
        from: oThis.originFacilitator,
        gas: 4700000,
        gasPrice: 0,
        value: 0
      });

    return stakeResponse;
  },

  _stake: async function(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature) {
    const oThis = this;

    let stakeResponse = await oThis.erc20Gateway
      .stake(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature)
      .send({
        from: oThis.originFacilitator,
        gas: 4700000,
        gasPrice: 0,
        value: 0
      });

    return stakeResponse;
  },

  _processStakingCall: async function(messageHash, unlockSecret) {
    const oThis = this;

    let processStakingResponse = await oThis.erc20Gateway.processStaking(messageHash, unlockSecret).call({
      from: oThis.originFacilitator,
      gas: 4700000,
      gasPrice: 0,
      value: 0
    });

    return processStakingResponse;
  },

  _processStaking: async function(messageHash, unlockSecret) {
    const oThis = this;

    let processStakingResponse = await oThis.erc20Gateway.processStaking(messageHash, unlockSecret).send({
      from: oThis.originFacilitator,
      gas: 4700000,
      gasPrice: 0,
      value: 0
    });

    return processStakingResponse;
  },

  _getStateRoot: async function(receipt, web3) {
    const oThis = this;
    console.log('block number  ', receipt.blockNumber);
    let block = await web3.eth.getBlock(receipt.blockNumber);
    console.log('block  ', block);
    return block.stateRoot;
  },

  _commitStateRootOnAuxiliary: async function(blockHeight, stateRoot) {
    let oThis = this;

    console.log('blockHeight: ', blockHeight);
    console.log('stateRoot: ', stateRoot);
    console.log('oThis.config.auxiliaryWorkerAddress: ', oThis.config.auxiliaryWorkerAddress);
    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis.originCoreAddress);

    await auxiliaryWeb3.eth.personal.unlockAccount(oThis.config.auxiliaryWorkerAddress, 'testtest');
    const commitStateRootReceipt = await oThis.core.auxiliary.commitStateRoot(blockHeight, stateRoot).send({
      from: oThis.config.auxiliaryWorkerAddress,
      gasPrice: 0,
      gas: 4700000
    });

    return commitStateRootReceipt;
  },

  _proveGateway: async function(blockHeight, rlpEncodedAccount, rlpParentNodes) {
    const oThis = this;

    console.log('blockHeight: ', blockHeight);
    console.log('rlpEncodedAccount: ', rlpEncodedAccount);
    console.log('rlpParentNodes: ', rlpParentNodes);
    console.log('oThis.config.auxiliaryWorkerAddress: ', oThis.config.auxiliaryWorkerAddress);

    let proofResponse = await oThis.erc20Gateway.auxiliary
      .proveGateway(blockHeight, rlpEncodedAccount, rlpParentNodes)
      .send({
        from: oThis.config.auxiliaryWorkerAddress,
        gasPrice: 0,
        gas: 470000
      });

    return proofResponse;
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
    console.log('staker: ', staker);
    console.log('stakerNonce: ', stakerNonce);
    console.log('beneficiary: ', beneficiary);
    console.log('amount: ', amount);
    console.log('gasPrice: ', gasPrice);
    console.log('blockHeight: ', blockHeight);
    console.log('hashLock: ', hashLock);
    console.log('rlpParentNodes: ', rlpParentNodes);

    const oThis = this;

    let auxiliaryWeb3 = new (oThis.ic().AuxiliaryWeb3())(oThis.originCoreAddress);
    await auxiliaryWeb3.eth.personal.unlockAccount(oThis.auxiliaryFacilitator, 'testtest');

    let confirmStakingIntentHashResponse = await oThis.erc20Gateway
      .confirmStakingIntent(staker, stakerNonce, beneficiary, amount, gasPrice, blockHeight, hashLock, rlpParentNodes)
      .send({
        from: oThis.auxiliaryFacilitator,
        gas: 4700000,
        gasPrice: 0
      });

    return confirmStakingIntentHashResponse;
  },

  _processMintingCall: async function(messageHash, unlockSecret) {
    const oThis = this;

    let processMintingResponse = await oThis.erc20Gateway.processMinting(messageHash, unlockSecret).call({
      from: oThis.auxiliaryFacilitator,
      gas: 4700000,
      gasPrice: 0,
      value: 0
    });

    return processMintingResponse;
  },

  _processMinting: async function(messageHash, unlockSecret) {
    const oThis = this;

    let processMintingResponse = await oThis.erc20Gateway.processMinting(messageHash, unlockSecret).send({
      from: oThis.auxiliaryFacilitator,
      gas: 4700000,
      gasPrice: 0,
      value: 0
    });

    return processMintingResponse;
  }
};

InstanceComposer.registerShadowableClass(StakeAndMint, 'StakeAndMint');

module.exports = StakeAndMint;
