'use strict';

const AbiBinProvider = require('../../AbiBinProvider');
const {
  sendTransaction,
  deprecationNoticeChainSetup,
} = require('../../utils/Utils');
const EIP20Gateway = require('../../ContractInteract/EIP20Gateway');

class GatewayHelper {
  constructor(web3, address, messageBusAddress, gatewayLibAddress) {
    this.web3 = web3;
    this.address = address;
    this.messageBus = messageBusAddress;
    this.gatewayLib = gatewayLibAddress;
    this.abiBinProvider = new AbiBinProvider();

    this.activateGateway = this.activateGateway.bind(this);
    this._activateGatewayRawTx = this._activateGatewayRawTx.bind(this);
    this.deploy = this.deploy.bind(this);
    this._deployRawTx = this._deployRawTx.bind(this);
    this.getStakeVault = this.getStakeVault.bind(this);
  }

  deploy(
    _token,
    _baseToken,
    _anchor,
    _bounty,
    _membersManager,
    messageBusAddress = this.messageBus,
    gatewayLibAddress = this.gatewayLib,
    txOptions,
    web3 = this.web3,
  ) {
    deprecationNoticeChainSetup('GatewayHelper.deploy');
    const tx = this._deployRawTx(
      _token,
      _baseToken,
      _anchor,
      _bounty,
      _membersManager,
      messageBusAddress,
      gatewayLibAddress,
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
    _token,
    _baseToken,
    _anchor,
    _bounty,
    _membersManager,
    messageBusAddress,
    gatewayLibAddress,
    txOptions,
    web3,
  ) {
    deprecationNoticeChainSetup('GatewayHelper._deployRawTx');

    const _burner = '0x0000000000000000000000000000000000000000';
    return EIP20Gateway.deployRawTx(
      web3,
      _token,
      _baseToken,
      _anchor,
      _bounty,
      _membersManager,
      _burner,
      messageBusAddress,
      gatewayLibAddress,
    );
  }

  activateGateway(
    _coGatewayAddress,
    txOptions,
    contractAddress = this.address,
    web3 = this.web3,
  ) {
    deprecationNoticeChainSetup('GatewayHelper.activateGateway');
    const tx = this._activateGatewayRawTx(
      _coGatewayAddress,
      txOptions,
      contractAddress,
      web3,
    );

    const defaultOptions = {
      gas: '2000000',
    };
    const _txOptions = Object.assign({}, defaultOptions, txOptions);

    return tx.then((_tx) => sendTransaction(_tx, _txOptions));
  }

  _activateGatewayRawTx(_coGatewayAddress, txOptions, contractAddress, web3) {
    deprecationNoticeChainSetup('GatewayHelper._activateGatewayRawTx');

    const gateway = new EIP20Gateway(web3, contractAddress);
    return gateway.activateGatewayRawTx(_coGatewayAddress);
  }

  getStakeVault(gatewayContractAddress, web3 = this.web3) {
    deprecationNoticeChainSetup('GatewayHelper.getStakeVault');

    const gateway = new EIP20Gateway(web3, gatewayContractAddress);
    return gateway.getStakeVault();
  }
}

module.exports = GatewayHelper;
