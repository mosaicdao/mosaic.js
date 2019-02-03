const Web3 = require('web3');

const originWeb3 = new Web3('http://localhost:8546');
const auxiliaryWeb3 = new Web3('http://localhost:8547');

const Anchor = require('../src/ContractInteract/Anchor.js');

const organisation = '0x913dA4198E6bE1D5f5E4a40D0667f70C0B5430Eb';
const anchorAddress = '0x5890c2fee9c995ea3f4aaecc8bcc4a90ffba3a6e';

originWeb3.eth
  .getBlock('latest')
  .then((block) => {
    const blockNumber = `${block.number}`;
    const stateRoot = block.stateRoot;
    console.log('blockNumber: ', blockNumber);
    console.log('stateRoot: ', stateRoot);
    const anchorContract = new Anchor(auxiliaryWeb3, anchorAddress);

    const txOptionsAnchor = {
      from: organisation,
      gas: '7500000',
    };
    anchorContract
      .anchorStateRoot(blockNumber, stateRoot, txOptionsAnchor)
      .then(() => {
        anchorContract.getLatestStateRootBlockHeight().then((latestBlock) => {
          console.log('latestBlock: ', latestBlock);
          anchorContract.getStateRoot(latestBlock).then((latestStateRoot) => {
            console.log('latestStateRoot: ', latestStateRoot);
          });
        });
      })
      .catch(console.log);
  })
  .catch(console.log);
