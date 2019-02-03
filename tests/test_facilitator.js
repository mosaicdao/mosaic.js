const Web3 = require('web3');

const originWeb3 = new Web3('http://localhost:8546');
const auxiliaryWeb3 = new Web3('http://localhost:8547');

const Facilitator = require('../src/Facilitator/Facilitator');
const Anchor = require('../src/ContractInteract/Anchor.js');

const gatewayAddress = '0x65f3a1a420679f9161c2b949ac372ab2bf091edc';
const cogatewayAddress = '0x3a043108953aacf3505503867f8db7c1585577c7';
const facilitator = new Facilitator(
  originWeb3,
  auxiliaryWeb3,
  gatewayAddress,
  cogatewayAddress,
);

const organisation = '0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Eb';
let txOptions = {
  from: organisation,
  gas: '7500000',
};

const staker = organisation;
const amount = '100000000';
const beneficiary = organisation;
const gasPrice = '0';
const gasLimit = '0';

const unlockSecret =
  '0x3363383134316333336430376436623136353162346236366639663566316431';
const hashLock =
  '0x64e453e30851fa25676fcf79fd3f1d92198d240a6e0894ec99eba9d9d6ed6ab2';

const facilitatorAddress = txOptions.from;

// facilitator.stake(
//   staker,
//   amount,
//   beneficiary,
//   gasPrice,
//   gasLimit,
//   hashLock,
//   txOptions,
// ).then((result) => {console.log('result: ', result)}).catch(console.log);

const txOptionOrigin = {
  from: organisation,
  gas: '7500000',
};

const txOptionAuxiliary = {
  from: organisation,
  gas: '7500000',
};

facilitator
  .progressStake(
    staker,
    amount,
    beneficiary,
    gasPrice,
    gasLimit,
    '3',
    hashLock,
    unlockSecret,
    txOptionOrigin,
    txOptionAuxiliary,
  )
  .then(console.log)
  .catch((exception) => {
    console.log(exception);
  });
