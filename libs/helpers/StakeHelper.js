'use strict';

const Contracts = require('../../libs/Contracts');

class StakeHelper {
  constructor(originWeb3, simpleToken, gateway, staker, bounty, txOptions) {
    const oThis = this;
    oThis.web3 = originWeb3;
    oThis.valueToken = simpleToken;
    oThis.simpleToken = simpleToken;
    oThis.gateway = gateway;
    oThis.staker = staker;
    oThis.bounty = bounty || '0';
    oThis.txOptions = txOptions || {
      gasPrice: '0x5B9ACA00'
    };
  }

  perform(_amount, _beneficiary, _gasPrice, _gasLimit, _nonce, _hashLock) {
    const oThis = this;
  }

  getNonce(staker, originWeb3, gateway) {
    const oThis = this;

    let web3 = originWeb3 || oThis.web3;
    gateway = gateway || oThis.gateway;
    staker = staker || oThis.staker;

    let contract = Contracts.getEIP20Gateway(web3, gateway);

    console.log(`* Fetching Staker Nonce`);
    return contract.methods.getNonce(staker).call();
  }

  approveStakeAmount(_value, txOptions, originWeb3, valueToken, gateway, staker) {
    const oThis = this;

    let web3 = originWeb3 || oThis.web3;
    valueToken = valueToken || oThis.valueToken;
    gateway = gateway || oThis.gateway;
    staker = staker || oThis.staker;

    txOptions = Object.assign(
      {
        from: staker,
        to: valueToken,
        gas: '100000'
      },
      oThis.txOptions || {},
      txOptions || {}
    );

    let contract = Contracts.getEIP20Token(web3, valueToken, txOptions);
    let tx = contract.methods.approve(gateway, _value);

    console.log(`* Approving Stake Amount`);
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  approveBountyAmount(_value, txOptions, originWeb3, simpleToken, gateway, staker) {
    const oThis = this;

    let web3 = originWeb3 || oThis.web3;
    simpleToken = simpleToken || oThis.simpleToken;
    gateway = gateway || oThis.gateway;
    staker = staker || oThis.staker;

    txOptions = Object.assign(
      {
        from: staker,
        to: simpleToken,
        gas: '100000'
      },
      oThis.txOptions || {},
      txOptions || {}
    );

    let contract = Contracts.getEIP20Token(web3, simpleToken, txOptions);
    let tx = contract.methods.approve(gateway, _value);

    console.log(`* Approving Bounty Amount`);
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }

  stake(_amount, _beneficiary, _gasPrice, _gasLimit, _nonce, _hashLock, txOptions, originWeb3, gateway, staker) {
    const oThis = this;

    let web3 = originWeb3 || oThis.web3;
    gateway = gateway || oThis.gateway;

    txOptions = Object.assign(
      {
        from: staker,
        to: valueToken,
        gas: '1000000'
      },
      oThis.txOptions || {},
      txOptions || {}
    );

    let contract = Contracts.getEIP20Gateway(web3, gateway, txOptions);
    let tx = contract.methods.stake(_amount, _beneficiary, _gasPrice, _gasLimit, _nonce, _hashLock);

    console.log(`* Staking SimpleToken`);
    return tx
      .send(txOptions)
      .on('transactionHash', function(transactionHash) {
        console.log('\t - transaction hash:', transactionHash);
      })
      .on('receipt', function(receipt) {
        console.log('\t - Receipt:\n\x1b[2m', JSON.stringify(receipt), '\x1b[0m\n');
      })
      .on('error', function(error) {
        console.log('\t !! Error !!', error, '\n\t !! ERROR !!\n');
        return Promise.reject(error);
      });
  }
}

module.exports = StakeHelper;
