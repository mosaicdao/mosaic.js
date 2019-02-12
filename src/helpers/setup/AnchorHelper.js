'use strict';

const {
  sendTransaction,
  deprecationNoticeChainSetup,
} = require('../../utils/Utils');
const Anchor = require('../../ContractInteract/Anchor');

class AnchorHelper {
  constructor(web3, coWeb3, address) {
    this.web3 = web3;
    this.coWeb3 = coWeb3;
    this.address = address;

    this.deploy = this.deploy.bind(this);
    this._deployRawTx = this._deployRawTx.bind(this);
    this.setCoAnchorAddress = this.setCoAnchorAddress.bind(this);
  }

  deploy(
    _remoteChainId,
    _blockHeight,
    _stateRoot,
    _maxStateRoots,
    _membersManager,
    txOptions,
    web3 = this.web3,
  ) {
    deprecationNoticeChainSetup('AnchorHelper.deploy');

    const tx = this._deployRawTx(
      _remoteChainId,
      _blockHeight,
      _stateRoot,
      _maxStateRoots,
      _membersManager,
      txOptions,
      web3,
    );

    const defaultOptions = {
      gas: '1000000',
    };
    const _txOptions = Object.assign({}, defaultOptions, txOptions);

    return sendTransaction(tx, _txOptions).then((txReceipt) => {
      this.address = txReceipt.contractAddress;
      return txReceipt;
    });
  }

  _deployRawTx(
    _remoteChainId,
    _blockHeight,
    _stateRoot,
    _maxStateRoots,
    _membersManager,
    txOptions,
    web3,
  ) {
    deprecationNoticeChainSetup('AnchorHelper._deployRawTx');
    const defaultOptions = {
      gas: '1000000',
    };

    if (txOptions) {
      Object.assign(defaultOptions, txOptions);
    }

    txOptions = defaultOptions;
    _maxStateRoots = _maxStateRoots || AnchorHelper.DEFAULT_MAX_STATE_ROOTS;

    return Anchor.deployRawTx(
      web3,
      _remoteChainId,
      _blockHeight,
      _stateRoot,
      _maxStateRoots,
      _membersManager,
      txOptions,
    );
  }

  setCoAnchorAddress(
    coAnchorAddress,
    txOptions,
    contractAddress = this.address,
    web3 = this.web3,
  ) {
    deprecationNoticeChainSetup('AnchorHelper.setCoAnchorAddress');

    const anchor = new Anchor(web3, contractAddress);
    return anchor.setCoAnchorAddress(coAnchorAddress, txOptions);
  }

  static get DEFAULT_MAX_STATE_ROOTS() {
    return 60;
  }
}

module.exports = AnchorHelper;
