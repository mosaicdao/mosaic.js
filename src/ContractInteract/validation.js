/**
 * Validates that the provided config object exitsts.
 *
 * @param {Object} config The configuration object.
 *
 * @throws Will throw an error if configuration is missing.
 */
const validateConfigExists = (config) => {
  if (!config) {
    throw new Error('Mandatory parameter "config" missing.');
  }
};

/**
 * Validates that a config key exists in the provided config object.
 *
 * @param {Object} config The configuration object.
 * @param {string} key The config key that should be present.
 * @param {string} configName The name to use for the config object in the error.
 *
 * @throws Will throw an error if configuration key is missing.
 */
const validateConfigKeyExists = (config, key, configName) => {
  if (!config[key]) {
    throw new Error(
      `Mandatory configuration "${key}" missing. Set ${configName}.${key}`,
    );
  }
};

module.exports = {
  validateConfigExists,
  validateConfigKeyExists,
};
