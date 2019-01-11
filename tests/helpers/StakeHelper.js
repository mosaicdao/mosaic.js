'use strict';

// Load external packages
const chai = require('chai'),
  Web3 = require('web3'),
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
// let caMockToken = null;
// let caGateway = null;

let caMockToken = '0x7942c4404E7FEF78008246426C336bBA97e2f69B';
let caGateway = '0x7A309E56c3E6E446A09a9FB70EAa715CaF546Eb5';

let staker;

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
  let _numAmtToStake = 20;
  let amountToStake = web3.utils.toWei(String(_numAmtToStake));
  let bountyAmount = web3.utils.toWei(String(_numAmtToStake));
  let amountToFund = web3.utils.toWei(String(5 * _numAmtToStake));
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
            caGateway = chainSetupOutput.addresses.gateway;
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

  it('should get staker nonce', function() {
    this.timeout(3 * 60 * 1000); //3 Minutes
    let helper = new StakeHelper();
    return helper.getNonce(staker, web3, caGateway).then(function(stakerNonce) {
      console.log('stakerNonce', stakerNonce);
    });
  });

  it('should approve stake amount', function() {
    this.timeout(3 * 60 * 1000); //3 Minutes
    let helper = new StakeHelper();
    return helper.approveStakeAmount(amountToStake, null, web3, caMockToken, caGateway, staker);
  });

  it('should approve bounty amount', function() {
    this.timeout(3 * 60 * 1000); //1 Minutes
    let helper = new StakeHelper();
    return helper.approveBountyAmount(bountyAmount, null, web3, caMockToken, caGateway, staker);
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
