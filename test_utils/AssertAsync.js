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

const chai = require('chai');

const assert = chai.assert;

/**
 * This class includes the utitity assert function
 */
class AssertAsync {
  static async throws(fn, regExp) {
    let f = () => {};
    try {
      await fn();
    } catch (e) {
      f = () => {
        throw e;
      };
    } finally {
      assert.throws(f, regExp);
    }
  }

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
}

module.exports = AssertAsync;
