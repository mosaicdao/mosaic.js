'use strict';

const Organization = require('../ContractInteract/Organization');

const setup = (
  originWeb3,
  auxiliaryWeb3,
  originOrganizationConfig,
  auxiliaryOrganizationConfig,
  originTxOptions,
  auxiliaryTxOptions,
) => {
  const originOrganization = Organization.setup(
    originWeb3,
    originOrganizationConfig,
    originTxOptions,
  );
  const auxiliaryOrganization = Organization.setup(
    auxiliaryWeb3,
    auxiliaryOrganizationConfig,
    auxiliaryTxOptions,
  );

  return Promise.all([originOrganization, auxiliaryOrganization]);
};

module.exports = setup;
