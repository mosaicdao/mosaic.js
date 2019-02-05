const Web3 = require('web3');
const BN = require('bn.js');
const Chain = require('../src/Chain');
const Mosaic = require('../src/Mosaic');
const Anchor = require('../src/ContractInteract/Anchor.js');
const Facilitator = require('../src/Facilitator/Facilitator');
const OSTPrime = require('../src/ContractInteract/OSTPrime');

const originContractAddresses = {
  Anchor: '0x98f52533e38d9434a605054414aeaf7fac50aaad',
  EIP20Gateway: '0x2d2b6a558bdcb4398dc5256c7886ea770565c6fa',
};

const auxiliaryContractAddresses = {
  OSTPrime: '0xd69592cb95cd5f38f9fc86bcdba10cce6842291b',
  Anchor: '0x0a53e142138c0d68f5cf968cc74c6f633df57f6b',
  EIP20CoGateway: '0x8fb632da59e73450e097847c0c75608f79770182',
};

const originWeb3Provider = 'http://localhost:8546';
const originWeb3 = new Web3(originWeb3Provider);
const originChain = new Chain(originWeb3, originContractAddresses);

const auxiliaryWeb3Provider = 'http://localhost:8547';
const auxiliaryWeb3 = new Web3(auxiliaryWeb3Provider);
const auxiliaryChain = new Chain(auxiliaryWeb3, auxiliaryContractAddresses);

const mosaic = new Mosaic(originChain, auxiliaryChain);

const facilitator = new Facilitator(mosaic);

const organisation = '0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Eb';

const staker = organisation;
const amount = '100000000';
const beneficiary = organisation;
const gasPrice = '0';
const gasLimit = '0';
const unlockSecret =
  '0x3363383134316333336430376436623136353162346236366639663566316431';
const hashLock =
  '0x64e453e30851fa25676fcf79fd3f1d92198d240a6e0894ec99eba9d9d6ed6ab2';

const txOptionOrigin = {
  from: organisation,
  gas: '7500000',
};

const txOptionAuxiliary = {
  from: organisation,
  gas: '7500000',
};

const stake = function() {
  return facilitator.stake(
    staker,
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    hashLock,
    txOptionOrigin,
  );
};

const anchorCoGateway = function() {
  const anchorContract = new Anchor(
    mosaic.auxiliary.web3,
    mosaic.auxiliary.contractAddresses.Anchor,
  );
  return mosaic.origin.web3.eth.getBlock('latest').then((block) => {
    const blockNumber = `${block.number}`;
    return anchorContract.anchorStateRoot(
      blockNumber,
      block.stateRoot,
      txOptionAuxiliary,
    );
  });
};

const anchorGateway = function() {
  const anchorContract = new Anchor(
    mosaic.origin.web3,
    mosaic.origin.contractAddresses.Anchor,
  );
  return mosaic.auxiliary.web3.eth.getBlock('latest').then((block) => {
    const blockNumber = `${block.number}`;
    return anchorContract.anchorStateRoot(
      blockNumber,
      block.stateRoot,
      txOptionAuxiliary,
    );
  });
};

const progressStake = function() {
  return facilitator.gateway.getNonce(staker).then((nonce) => {
    new BN(nonce).subn(1);
    return facilitator.progressStake(
      staker,
      amount,
      beneficiary,
      gasPrice,
      gasLimit,
      new BN(nonce).subn(1).toString(10),
      hashLock,
      unlockSecret,
      txOptionOrigin,
      txOptionAuxiliary,
    );
  });
};

const redeemAmount = '1000';

const txOptionRedeem = {
  from: organisation,
  gas: '7500000',
  value: '100',
};
const txOptionOriginRedeem = {
  from: organisation,
  gas: '7500000',
};
const txOptionAuxiliaryRedeem = {
  from: organisation,
  gas: '7500000',
};

const redeemer = organisation;

const redeem = function() {
  return facilitator.redeem(
    redeemAmount,
    staker,
    gasPrice,
    gasLimit,
    hashLock,
    txOptionRedeem,
  );
};

const progressRedeem = function() {
  return facilitator.coGateway.getNonce(staker).then((nonce) => {
    new BN(nonce).subn(1);
    return facilitator.progressRedeem(
      redeemer,
      new BN(nonce).subn(1).toString(10),
      beneficiary,
      redeemAmount,
      gasPrice,
      gasLimit,
      hashLock,
      unlockSecret,
      txOptionOriginRedeem,
      txOptionAuxiliaryRedeem,
    );
  });
};

const wrap = function() {
  const prime = new OSTPrime(
    mosaic.auxiliary.web3,
    mosaic.auxiliary.contractAddresses.OSTPrime,
  );
  const txOptionWrap = {
    from: organisation,
    gas: '7500000',
    value: redeemAmount,
  };
  return prime.wrap(txOptionWrap).then(() => {
    return prime.balanceOf(organisation).then((balance) => {
      //console.log('balance: ', balance);
    });
  });
};

function getBalance() {
  return facilitator.coGateway.getEIP20UtilityToken().then((token) => {
    return token.balanceOf(organisation);
  });
}

function run() {
  return stake()
    .then((stakeResult) => {
      //console.log('stakeResult: ', stakeResult);
      anchorCoGateway().then((anchorResult) => {
        //console.log('anchorResult: ', anchorResult);
        progressStake().then((progressStakeResult) => {
          //console.log('progressStakeResult: ', progressStakeResult);
          wrap().then((wrapResult) => {
            //console.log('wrapResult: ', wrapResult);
            getBalance().then((balance) => {
              //console.log('Balance is ', balance);
              redeem().then((redeemResult) => {
                //console.log('redeemResult: ', redeemResult);
                anchorGateway().then((anchorGatewayResult) => {
                  //console.log('anchorGatewayResult: ', anchorGatewayResult);
                  progressRedeem().then((progressRedeemResult) => {
                    //console.log('progressRedeemResult: ', progressRedeemResult);
                  });
                });
              });
            });
          });
        });
      });
    })
    .catch(console.log);
}

function runRedeem() {
  wrap().then((wrapResult) => {
    //console.log('wrapResult: ', wrapResult);
    getBalance().then((balance) => {
      //console.log('Balance is ', balance);
      redeem().then((redeemResult) => {
        console.log('redeemResult: ', redeemResult);
        anchorGateway().then((anchorGatewayResult) => {
          //console.log('anchorGatewayResult: ', anchorGatewayResult);
          // progressRedeem().then((progressRedeemResult) => {
          //   //console.log('progressRedeemResult: ', progressRedeemResult);
          // });
        });
      });
    });
  });
}

run();
//runRedeem();

//stake().then(console.log).catch(console.log);
//anchor().then(console.log).catch(console.log);
//progressStake().then(console.log).catch(console.log);
//redeem().then(console.log).catch(console.log);
//anchorGateway().then(console.log).catch(console.log);
//progressRedeem().then(console.log).catch(console.log);
