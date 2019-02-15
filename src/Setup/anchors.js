'use strict';

const Anchor = require('../ContractInteract/Anchor');

/**
 * A single function to deploy anchors on origin and auxiliary and link them.
 *
 * @param {Web3} originWeb3 Web3 that points to origin.
 * @param {Web3} auxiliaryWeb3 Web3 that points to auxiliary.
 * @param {AnchorSetupConfig} originAnchorConfig Configuration of the origin anchor.
 * @param {AnchorSetupConfig} auxiliaryAnchorConfig Configuration of the auxiliary anchor.
 * @param {Object} originTxOptions Transaction options for the origin chain.
 * @param {Object} auxiliaryTxOptions Transaction options for the auxiliary chain.
 *
 * @returns {Promise<[Anchor, Anchor]>} The origin and the auxiliary anchor.
 */
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
