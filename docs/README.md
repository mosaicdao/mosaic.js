# 💠 mosaic.js Documentation

Mosaic is a parallelization schema for decentralized applications.
It composes heterogeneous blockchain systems into one another.
Decentralized applications can use Mosaic to compute over a composed network of multiple blockchain systems in parallel.

Mosaic enables building scalable blockchain token economies through the bidirectional transposition of ERC20 tokens on one blockchain, the *origin* chain, and a utility token representation on another blockchain, the *auxiliary* chain.

The protocol defines a set of actions that together perform atomic token transfers across two blockchains using gateway contracts. A gateway for a given EIP20 token is comprised of a `EIP20Gateway` contract on origin, a corresponding `EIP20CoGateway` contract on auxiliary, and an EIP20 utility token contract on auxiliary that mints and burns utility tokens to atomically mirror tokens staked and unstaked on the origin chain.

Atomicity is achieved using a 2-phase message passing architecture between the chains. Messages are declared on the source chain, and confirmed on the target chain with Merkle Patricia proofs once the source chain is finalized. Once messages are confirmed on the target chain, they can efficiently progressed with a hashlock.
Messages can also be reverted if they are not yet completed on the target chain.

You can read [the draft of the mosaic whitepaper][mosaic whitepaper] or [the original OpenST whitepaper][openst whitepaper].

## Continue Reading

* read about setting up gateways: [setup]

[mosaic whitepaper]: https://github.com/OpenSTFoundation/mosaic-contracts/blob/develop/docs/mosaicv0.pdf
[openst whitepaper]: https://drive.google.com/file/d/0Bwgf8QuAEOb7Z2xIeUlLd21DSjQ/view
[setup]: ./setup/README.md
