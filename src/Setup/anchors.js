'use strict';

const Anchor = require('../ContractInteract/Anchor');

const setup = (
  originWeb3,
  auxiliaryWeb3,
  originAnchorConfig,
  auxiliaryAnchorConfig,
  originTxOptions,
  auxiliaryTxOptions,
) => {
  const originSetupConfig = originAnchorConfig;
  const auxiliarySetupConfig = auxiliaryAnchorConfig;

  const originAnchor = Anchor.setup(
    originWeb3,
    auxiliaryWeb3,
    originSetupConfig,
    originTxOptions,
  );

  const auxiliaryAnchor = originAnchor.then((originAnchorInstance) => {
    auxiliarySetupConfig.coAnchorAddress = originAnchorInstance.address;

    return Anchor.setup(
      auxiliaryWeb3,
      originWeb3,
      auxiliarySetupConfig,
      auxiliaryTxOptions,
    ).then((auxiliaryAnchorInstance) => [
      originAnchorInstance,
      auxiliaryAnchorInstance,
    ]);
  });

  const configuredAnchors = auxiliaryAnchor.then(
    ([originAnchorInstance, auxiliaryAnchorInstance]) => {
      const setCoAnchorTxOptions = {
        ...originTxOptions,
        from: originAnchorConfig.deployer,
      };

      const transaction = originAnchorInstance.setCoAnchorAddress(
        auxiliaryAnchorInstance.address,
        setCoAnchorTxOptions,
      );

      return transaction.then(() => [
        originAnchorInstance,
        auxiliaryAnchorInstance,
      ]);
    },
  );

  return configuredAnchors;
};

module.exports = setup;
