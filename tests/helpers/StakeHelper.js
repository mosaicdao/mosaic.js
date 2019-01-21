'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
  BN = require('bn.js'),
  Package = require('../../index'),
  ChainSetup = Package.ChainSetup,
  Contracts = Package.Contracts,
  StakeHelper = Package.Helpers.StakeHelper,
  assert = chai.assert;

const config = require('../../tests/utils/configReader'),
  Web3WalletHelper = require('../../tests/utils/Web3WalletHelper'),
  MockContractsDeployer = require('../../tests/utils/MockContractsDeployer');

const web3 = new Web3(config.gethRpcEndPoint);
let web3WalletHelper = new Web3WalletHelper(web3);

//Contract Address. TBD: Do not forget to set caMockToken && caGateway = null below.
let caMockToken = null;
let caGateway = null;

let staker;

let validateReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

let validateDeploymentReceipt = (receipt) => {
  validateReceipt(receipt);
  let contractAddress = receipt.contractAddress;
  assert.isNotEmpty(contractAddress, 'Deployment Receipt is missing contractAddress');
  assert.isTrue(web3.utils.isAddress(contractAddress), 'Invalid contractAddress in Receipt');
  return receipt;
};

let originConfig = {
  gasPrice: '0x5B9ACA00',
  tokenOrganization: {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker]
  },
  anchorOrganization: {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker]
  },
  libs: {
    deployer: config.deployerAddress
  },
  anchor: {
    remoteChainId: '12345',
    deployer: config.deployerAddress,
    organizationOwner: config.organizationOwner
  },

  gateway: {
    deployer: config.deployerAddress,
    bounty: '100'
  }
};

let auxiliaryConfig = {
  gasPrice: '0',
  tokenOrganization: {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker]
  },
  ostPrime: {
    deployer: config.deployerAddress,
    chainOwner: config.chainOwner
  },
  anchorOrganization: {
    deployer: config.deployerAddress,
    owner: config.organizationOwner,
    admin: config.organizationAdmin,
    workers: [config.organizationWorker]
  },
  anchor: {
    remoteChainId: '12345',
    deployer: config.deployerAddress,
    organizationOwner: config.organizationOwner
  },
  libs: {
    deployer: config.deployerAddress
  },
  cogateway: {
    deployer: config.deployerAddress,
    bounty: '100'
  }
};

//To-Do: Write Test Case here.
describe('tests/ChainSetup', function() {
  let _numAmtToStake = 1;
  let amountToStake = web3.utils.toWei(String(_numAmtToStake));
  let bountyAmount = web3.utils.toWei(String(_numAmtToStake));
  let amountToFund = web3.utils.toWei(String(13 * _numAmtToStake));
  let amountToApprove;
  before(function() {
    this.timeout(60 * 60 * 1000); //1 Hr
    //This hook could take long time.
    return web3WalletHelper
      .init(web3)
      .then(function() {
        if (!caMockToken) {
          let deployer = new MockContractsDeployer(config.deployerAddress, web3);
          return deployer.deployMockToken().then(function() {
            caMockToken = deployer.addresses.MockToken;
            return caMockToken;
          });
        }
        return caMockToken;
      })
      .then(function(mockTokenAddress) {
        if (!caGateway) {
          let valueToken = mockTokenAddress;
          let helper = new ChainSetup(web3, web3);
          return helper.setup(valueToken, originConfig, auxiliaryConfig).then(function(output) {
            let chainSetupOutput = output;
            console.log('chainSetupOutput', JSON.stringify(chainSetupOutput));
            caGateway = chainSetupOutput.addresses.origin.gateway;
          });
        }
        return caGateway;
      })
      .then(function() {
        //Create a new staker.
        let stakerAccount = web3.eth.accounts.create();
        web3.eth.accounts.wallet.add(stakerAccount);
        staker = stakerAccount.address;

        console.log('-- Transfer ETH to Staker. Staker address:', staker);
        //Give staker some ETH.
        return web3.eth.sendTransaction({
          from: config.deployerAddress,
          to: staker,
          value: web3.utils.toWei('10'),
          gasPrice: originConfig.gasPrice,
          gas: '100000'
        });
      })
      .then(function() {
        console.log('-- Transfer SimpleToken to Staker');
        //Give staker some OST to stake.
        let contracts = new Contracts(web3, web3);
        let mockToken = contracts.SimpleToken(caMockToken);
        let tx = mockToken.methods.transfer(staker, amountToFund);
        return tx.send({
          from: config.deployerAddress,
          gasPrice: originConfig.gasPrice,
          gas: '100000'
        });
      });
  });

  it('should generate valid hashLock', function() {
    let expectedOutput = {
      secret: '5df052eb5e447cc3eddd8e3ebbe35ab0',
      unlockSecret: '0x3564663035326562356534343763633365646464386533656262653335616230',
      hashLock: '0x78a9ed63184870532c41557bbd5fa535a8a30073e9518a0485ae7880c33da5d4'
    };

    let secret = expectedOutput.secret;

    let stakeHashLockInfo = StakeHelper.toHashLock(secret);
    // console.log("stakeHashLockInfo", stakeHashLockInfo, "\nsecret", secret);
    assert.deepEqual(stakeHashLockInfo, expectedOutput, 'Invalid toHashLock output');
  });

  it('should get staker nonce', function() {
    this.timeout(3 * 60 * 1000); //3 Minutes
    let helper = new StakeHelper();
    return helper.getNonce(staker, web3, caGateway).then(function(stakerNonce) {
      assert.equal(1, stakerNonce, 'Staker nonce should be 1');
    });
  });

  it('should get gateway bounty', function() {
    this.timeout(3 * 60 * 1000); //3 Minutes
    let helper = new StakeHelper();
    return helper.getBounty(staker, web3, caGateway).then(function(bounty) {
      let bnBounty = new BN(bounty);
      let bnAmountToStkae = new BN(amountToStake);
      amountToApprove = bnBounty.add(bnAmountToStkae).toString(10);
    });
  });

  it('should approve stake amount', function() {
    this.timeout(3 * 60 * 1000); //3 Minutes
    let helper = new StakeHelper();
    amountToApprove = amountToApprove || 2 + amountToStake; //String addition here.
    return helper.approveStakeAmount(amountToApprove, null, web3, caMockToken, caGateway, staker).then(validateReceipt);
  });

  // @dev - As only 1 active stake is allowed per staker, below test case has been commented.
  // helper.stake will be tested along with perform.
  // Please do not remove this commented test-case.
  // Please do keep it updated as need.
  // Later, we shall create another staker key for perform.
  /* ---------------------------------------------------------------- */

  // it('should stake SimpleToken', function () {
  //   this.timeout(3 * 60 * 1000); //3 Minutes

  //   let stakeHashLockInfo = StakeHelper.createSecretHashLock();

  //   let _amount = amountToStake;
  //   let _beneficiary = staker;
  //   let _gasPrice = "0";
  //   let _gasLimit = "10000000";
  //   let _nonce = 1; //New key, so shall be 1.
  //   let _hashLock = stakeHashLockInfo.hashLock;

  //   let helper = new StakeHelper();
  //   return helper.stake(_amount, _beneficiary, _gasPrice, _gasLimit, _nonce, _hashLock, null, web3, caGateway, staker)
  //     .then(validateReceipt);

  // });
  /* ---------------------------------------------------------------- */

  it('should perform staking', function() {
    this.timeout(30 * 60 * 1000); //30 Minutes
    let helper = new StakeHelper(web3, caMockToken, caGateway, staker);
    let _amount = amountToStake;
    let _beneficiary = staker;
    let _gasPrice = '0';
    let _gasLimit = '10000000';

    return helper.perform(_amount, _beneficiary, _gasPrice, _gasLimit).then((output) => {
      validateReceipt(output.receipt);
      console.log('Staking Performed. output:', JSON.stringify(output));
    });
  });
});

// Go easy on RPC Client (Geth)
(function() {
  let maxHttpScokets = 10;
  let httpModule = require('http');
  httpModule.globalAgent.keepAlive = true;
  httpModule.globalAgent.keepAliveMsecs = 30 * 60 * 1000;
  httpModule.globalAgent.maxSockets = maxHttpScokets;
})();
