'use strict';

const {
  sendTransaction,
  deprecationNoticeChainSetup,
} = require('../../utils/Utils');
const EIP20CoGateway = require('../../ContractInteract/EIP20CoGateway');

class CoGatewayHelper {
  constructor(web3, address, messageBus, gatewayLib) {
    this.web3 = web3;
    this.address = address;
    this.messageBus = messageBus;
    this.gatewayLib = gatewayLib;
  }

  deploy(
    _valueToken,
    _utilityToken,
    _anchor,
    _bounty,
    _membersManager,
    _gateway,
    messageBus = this.messageBus,
    gatewayLib = this.gatewayLib,
    txOptions,
    web3 = this.web3,
  ) {
    deprecationNoticeChainSetup('CoGatewayHelper.deploy');
    const tx = this._deployRawTx(
      _valueToken,
      _utilityToken,
      _anchor,
      _bounty,
      _membersManager,
      _gateway,
      messageBus,
      gatewayLib,
      txOptions,
      web3,
    );

    const defaultOptions = {
      gas: '7500000',
    };
    const _txOptions = Object.assign({}, defaultOptions, txOptions);

    return sendTransaction(tx, _txOptions).then((txReceipt) => {
      this.address = txReceipt.contractAddress;
      return txReceipt;
    });
  }

  _deployRawTx(
    _valueToken,
    _utilityToken,
    _anchor,
    _bounty,
    _membersManager,
    _gateway,
    messageBus,
    gatewayLib,
    txOptions,
    web3,
  ) {
    deprecationNoticeChainSetup('CoGatewayHelper._deployRawTx');

    const defaultOptions = {
      gas: '7500000',
    };
    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }
    txOptions = defaultOptions;

    const _burner = '0x0000000000000000000000000000000000000000';

    return EIP20CoGateway.deployRawTx(
      web3,
      _valueToken,
      _utilityToken,
      _anchor,
      _bounty,
      _membersManager,
      _gateway,
      _burner,
      messageBus,
      gatewayLib,
    );
  }
}

module.exports = CoGatewayHelper;
