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

    const stakeAmount = 100,
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

    const stakeResponse = await oThis._stake(stakeAmount, beneficiary, staker, gasPrice, nonce, hashLock.l, signature);
    console.log('stakeResponse: ', stakeResponse);

    /*                  const stateRoot = oThis._getStateRoot(stakeResponse, oThis.web);
                      console.log('stateRoot: ', stateRoot);

                      const commitStateRootResponse = await oThis._commitStateRootOnAuxiliary(stateRoot.blockNumber, stateRoot);
                      console.log('commitStateRootResponse: ', commitStateRootResponse);

                      await oThis.rsync.perform();
                      console.log('RSYNC done, generating proof');

                      const proveGateway = await oThis._proveGateway(stateRoot.blockNumber, stateRoot);
                      console.log('proveGateway: ', proveGateway);
       */
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

  processStaking: async function() {},

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

  _stake: async function(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature) {
    const oThis = this;
    console.log(
      'oThis.erc20Gateway: ',
      oThis.erc20Gateway.stake(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature)
    );

    let stakeResponse = await oThis.erc20Gateway
      .stake(amount, beneficiary, staker, gasPrice, nonce, hashLock, signature)
      .call({
        from: oThis.originFacilitator,
        gas: 4700000,
        gasPrice: 100,
        value: 0
      });

    return stakeResponse;
  },

  _getStateRoot: async function(receipt, web3) {
    const oThis = this;
    console.log('block number  ', receipt.blockNumber);
    let block = await web3.eth.getBlock(receipt.blockNumber);
    console.log('block  ', block);
    return Promise.resolve(block.stateRoot);
  },

  _commitStateRootOnAuxiliary: async function(blockHeight, stateRoot) {
    let oThis = this;

    const commitStateRootReceipt = await oThis.core.auxiliary.commitStateRoot(blockHeight, stateRoot).send({
      from: oThis.config.auxiliaryWorkerAddress,
      gasPrice: '0x0',
      gas: 4700000
    });

    return commitStateRootReceipt;
  },

  _proveGateway: async function(blockHeight, stateRoot) {
    const oThis = this;
    let proof = new Proof(stateRoot, path + 'chaindata');

    let gatewayAddress = oThis.origin.gatewayAddress.slice(2),
      gatewayProof = await proof.buildAccountProof(gatewayAddress).catch((error) => {
        console.log(error);
      });

    console.log(gatewayProof);
    let rlpEncodedAccount = '0x' + gatewayProof.value,
      rlpParentNodes = '0x' + gatewayProof.parentNodes;

    console.log('proving gateway');

    let proofResponse = await oThis.erc20Gateway.auxiliary
      .proveGateway(blockHeight, rlpEncodedAccount, rlpParentNodes)
      .send({
        from: oThis.config.auxiliaryWorkerAddress,
        gasPrice: 0,
        gas: 470000
      });

    return proofResponse;
  }
};

InstanceComposer.registerShadowableClass(StakeAndMint, 'StakeAndMint');

module.exports = StakeAndMint;
