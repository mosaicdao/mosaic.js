# Mosaic JS Change Log

## Version 0.10.0 ⚓️ Anchor

<!-- [**Release 0.10.0, (<date-here>)**](https://github.com/OpenSTFoundation/mosaic.js/releases/tag/0.10.0) -->

You can use mosaic.js to interact with contracts on mosaic chains.

It requires [mosaic-contracts](https://github.com/OpenSTFoundation/mosaic-contracts) for ABIs and BINs of contracts.

### Notable Changes

* Library is provided via npm package [@openstfoundation/mosaic.js](https://www.npmjs.com/package/@openstfoundation/mosaic.js)
* Now provides a `Mosaic` "super" provider to access both chains and their contract addresses ([#44](https://github.com/OpenSTFoundation/mosaic.js/pull/44)).
* Now provides a `Facilitator` class for easier interaction ([#42](https://github.com/OpenSTFoundation/mosaic.js/pull/42), [#51](https://github.com/OpenSTFoundation/mosaic.js/pull/51), [#56](https://github.com/OpenSTFoundation/mosaic.js/pull/56)).
* Now provides contract classes to interact with the contracts:
  * Anchor ([#42](https://github.com/OpenSTFoundation/mosaic.js/pull/42)).
  * EIP20Gateway and EIP20CoGateway ([#42](https://github.com/OpenSTFoundation/mosaic.js/pull/42)).
  * EIP20Token ([#42](https://github.com/OpenSTFoundation/mosaic.js/pull/42)).
  * OSTPrime ([#51](https://github.com/OpenSTFoundation/mosaic.js/pull/51)).
  * Libraries ([#62](https://github.com/OpenSTFoundation/mosaic.js/pull/62)).
* Non-private functions no longer start with an underscore ([#97](https://github.com/OpenSTFoundation/mosaic.js/pull/97)).
* ABIs and BINs are now accessed as a dependency on [mosaic-contracts](https://github.com/OpenSTFoundation/mosaic-contracts) ([#39](https://github.com/OpenSTFoundation/mosaic.js/pull/39)).
* `web3` and `web3-eth-accounts` are now peer dependencies ([#85](https://github.com/OpenSTFoundation/mosaic.js/pull/85)).

#### Deprecations

* `ChainSetup` and setup helpers are now deprecated ([#62](https://github.com/OpenSTFoundation/mosaic.js/pull/62)).
  * See ([#57](https://github.com/OpenSTFoundation/mosaic.js/pull/57)) for help on how to migrate.
* `StakeHelper` is now deprecated ([#87](https://github.com/OpenSTFoundation/mosaic.js/pull/87)).
  * See ([#86](https://github.com/OpenSTFoundation/mosaic.js/pull/86)) for help on how to migrate.
