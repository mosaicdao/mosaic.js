const { assert } = require('chai');
const Web3 = require('web3');
const { abi, bin } = require('../contracts/EIP20Token.json');

const shared = require('../shared');

const assertReceipt = (receipt) => {
  assert.isNotNull(receipt, 'Transaction Receipt is null');
  assert.isObject(receipt, 'Transaction Receipt is not an object');
  assert.isTrue(receipt.status, 'Transaction failed.');
  return receipt;
};

const assertDeploymentReceipt = (receipt) => {
  assertReceipt(receipt);
  const { contractAddress } = receipt;
  assert.isNotEmpty(
    contractAddress,
    'Deployment Receipt is missing contractAddress',
  );
  assert.isTrue(
    Web3.utils.isAddress(contractAddress),
    'Invalid contractAddress in Receipt',
  );
  return receipt;
};

describe('EIP20Token', async () => {
  it('should deploy new EIP20Token contract', async () => {
    const txOptions = {
      from: shared.setupConfig.deployerAddress,
      gasPrice: shared.setupConfig.gasPrice,
      gasLimit: 700000,
    };

    const { web3 } = shared.origin;
    const contract = new web3.eth.Contract(abi, undefined, txOptions);

    console.log('* Deploying EIP20Token Contract');
    await contract
      .deploy(
        {
          data: bin,
          arguments: [
            'JLP',
            'Jean-Luc Picard Token',
            '800000000000000000000000000', // 800 mio.
            '18',
          ],
        },
        txOptions,
      )
      .send(txOptions, (error, transactionHash) => {
        console.log(error, transactionHash);
      })
      .on('error', (error) => {
        assert(false, `Could not deploy EIP20Token: ${error}`);
      })
      .on('receipt', (receipt) => {
        assertDeploymentReceipt(receipt);

        console.log(
          '\t - EIP20Token Contract Address:',
          receipt.contractAddress,
        );
        shared.origin.addresses.EIP20Token = receipt.contractAddress;
      });
  });
});
