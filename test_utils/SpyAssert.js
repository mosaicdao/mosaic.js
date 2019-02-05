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
 * This class includes the utitity functions to assert spy data.
 */
class SpyAssert {
  /**
   * @function assertSpy
   *
   * Asserts the spy data.
   *
   * @param {Object} spy Spy object.
   * @param {number} number of times the spy was called.
   * @param {Array} inputArgs Input arguments
   *
   */
  static assert(spy, callCount, inputArgs) {
    assert.strictEqual(
      spy.callCount,
      callCount,
      'Call count must match with the expected value.',
    );
    if (inputArgs) {
      for (let i = 0; i < callCount; i += 1) {
        const expectedArguments = inputArgs[i];
        const actualArguments = spy.args[i];
        assert.strictEqual(
          expectedArguments.length,
          actualArguments.length,
          'Expected and actual argument counts should be same',
        );
        for (let params = 0; params < actualArguments.length; params += 1) {
          assert.strictEqual(
            actualArguments[params],
            expectedArguments[params],
            'Input params must match with the expected value.',
          );
        }
      }
    }
  }

  /**
   * @function assertSpy
   *
   * Asserts the spy data.
   *
   * @param {Object} spy Spy object.
   * @param {number} number of times the spy was called.
   */
  static assertCall(spy, callCount) {
    assert.strictEqual(
      spy.callCount,
      callCount,
      'Call count must match with the expected value.',
    );
  }
}

module.exports = SpyAssert;
