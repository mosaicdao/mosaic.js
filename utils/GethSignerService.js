"use strict";

const Signer = function ( web3 ) {
  const oThis = this;


  const _aToPwdMap = {};
  oThis.addAccount = function ( address, passphrase ) {
    _aToPwdMap[ address ] = passphrase;
  };

  oThis.signTransaction = function (transactionData) {
    if ( !transactionData || !transactionData.from ) {
      return Promise.reject('Invalid transactionData');
    }

    let _from = transactionData.from;
    if ( !_aToPwdMap.hasOwnProperty( _from ) ) {
      return Promise.reject('Unknown Address');
    }

    if ( !transactionData.gasPrice ) {
      return Promise.reject('Invalid gasPrice');
    }

    if ( !transactionData.gas ) {
      return Promise.reject('Invalid gas');
    }

    if ( !transactionData.to ) {
      return Promise.reject('Invalid to address');
    }

    if ( !transactionData.hasOwnProperty( 'value' ) ) {
      return Promise.reject('Invalid value');
    }

    if ( !transactionData.hasOwnProperty( 'data' ) ) {
      transactionData.data = "";
    }

    console.log("GSS :: Fetching Nonce");
    return  web3.eth.getTransactionCount( _from )
      .then( function ( _nonce ) {
        console.log("GSS :: Got Nonce");
        let finalData = Object.assign({}, transactionData, {
          nonce: _nonce
        });
        console.log("GSS :: Signing Tx");
        let _fromPassphrase = _aToPwdMap[ _from ];
        return web3.eth.personal.signTransaction( finalData, _fromPassphrase )
          .then( function ( signedTx ) {
            console.log("GSS :: Tx Signed");
            return signedTx;
          })
      });
  };
}

Signer.prototype = {
};


module.exports = Signer;
