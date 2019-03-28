'use strict';

const Organization = require('../ContractInteract/Organization');

/**
 * A single function to deploy organizations on origin and auxiliary.
 *
 * @param {Web3} originWeb3 Web3 that points to origin.
 * @param {Web3} auxiliaryWeb3 Web3 that points to auxiliary.
 * @param {OrganizationSetupConfig} originOrganizationConfig Configuration of the origin
 *                                                           organization.
 * @param {OrganizationSetupConfig} auxiliaryOrganizationConfig Configuration of the auxiliary
 *                                                              organization.
 * @param {Object} originTxOptions Transaction options for the origin chain.
 * @param {Object} auxiliaryTxOptions Transaction options for the auxiliary chain.
 *
 * @returns {Promise<[Organization, Organization]>} The origin and the auxiliary organization.
 */
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
