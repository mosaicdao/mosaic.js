// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------
//
// http://www.simpletoken.org/
//
// ----------------------------------------------------------------------------

'use strict';

const Web3 = require('web3');

const Target = require('./Target');

/**
 * A configuration for anchoring a state root.
 * @property {Target} target Which target to anchor onto.
 * @property {string} address The address of the anchor contract on the target chain.
 * @property {number} delay The delay to wait before anchoring a state root in blocks.
 */
class AnchorConfig {
  /**
   * @param {Object} config A configuration, for example read from a file in JSON or JS format.
   * @param {Object} anchorCmd The command that provides the options from CLI.
   * @param {string} target Which target to anchor onto.
   */
  constructor(config, anchorCmd, target) {
    AnchorConfig.validateTarget(target);

    this.target = target;

    // Optional parameters from the command overwrite the ones from the given config (file).
    this.update(config.anchor[target]);
    this.update(anchorCmd);
  }

  /**
   * Overwrites the current settings with the provided settings.
   * @param {Object} config A config object.
   */
  update(config) {
    if (config.address) {
      AnchorConfig.validateAddress(config.address);
      this.address = config.address;
    }

    if (config.delay) {
      AnchorConfig.validateDelay(config.delay);
      this.delay = config.delay;
    }
  }

  /**
   * Validates that the given target is a valid option.
   * @param {string} target Which target to anchor onto.
   */
  static validateTarget(target) {
    if (!Object.values(Target).includes(target)) {
      throw new Error(
        'argument `target` must be ' +
          `"${Target.ORIGIN}" or "${Target.AUXILIARY}"`,
      );
    }
  }

  /**
   * Validates that the given address is a valid option.
   * @param {string} address The address of the anchor on the target chain.
   */
  static validateAddress(address) {
    if (!Web3.utils.isAddress(address)) {
      throw new Error(
        `given address is not a valid ethereum address: ${address}`,
      );
    }
  }

  /**
   * Validates that the given delay is a valid option.
   * @param {number} delay The delay to wait before anchoring.
   */
  static validateDelay(delay) {
    console.log('checking"');
    if (typeof delay !== 'number') {
      throw new Error(`given delay is not a valid number: ${delay}`);
    }
  }
}

module.exports = AnchorConfig;
