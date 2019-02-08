const chai = require('chai');

const assert = chai.assert;

/**
 * This class includes the utitity assert function
 */
class AssertAsync {
  static async reject(promise, message) {
    try {
      await promise;
      throw new TypeError('Promise must reject');
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        message,
        `Exception reason must be "${message}" but found "${
          exception.message
        }"`,
      );
    }
  }

  static async reject(promise, message) {
    try {
      await promise;
      throw new Error('Promise must reject');
    } catch (exception) {
      assert.strictEqual(
        exception.message,
        message,
        `Exception reason must be "${message}" but found "${
          exception.message
        }"`,
      );
    }
  }
}

module.exports = AssertAsync;
