# Chainlink Terra

## Developing

### Requirements

This demo requires the following components:

- Rust:
  - [`rustup`](https://rustup.rs/) with `cargo` 1.44.1+.
  - [`rustc`](https://www.rust-lang.org/tools/install) and `cargo` 1.44.1+.
  - Install the `wasm32-unknown-unknown` target for Rust: `rustup target add wasm32-unknown-unknown`
- [NodeJS](https://nodejs.org/en/) 14 LTS or later.
- [Docker](https://www.docker.com/)
- A C compiler such as the one included in [GCC](https://gcc.gnu.org/install/).

Confirm that the necessary requirements are installed:

```sh
rustc --version
cargo --version
rustup target list --installed
docker --version
node --version
```

### Compile a contract

Example contracts are available in the `./contracts` directory of this
repository. Make sure you can compile and run the contracts before making
any changes. From the base of your cloned repository, run `cargo wasm` to
produce a wasm build for each contract:

```sh
cargo wasm
```

This produces a `.wasm` build file in the
`./target/wasm32-unknown-unknown/release/` directory for each
contract.


### Generating JSON Schema

While the Wasm calls (`init`, `handle`, `query`) accept JSON, this is not enough
information to use it. We need to expose the schema for the expected messages
to the clients. You can generate this schema by calling `cargo schema`, which
will output four files in `./YOUR_CONTRACT/schema`, corresponding to the three
message types the contract accepts, as well as the internal `State`.

```sh
cd ./contracts/YOUR_CONTRACT && cargo schema
```

These files are in standard json-schema format, which should be usable by
various client side tools, either to auto-generate codecs, or just to
validate incoming json with regard to the defined schema.

### Preparing the Wasm bytecode for production

Before we upload it to a chain, we need to ensure the smallest output size
possible, as this will be included in the body of a transaction. We also want
to have a reproducible build process, so third parties can verify that the
uploaded Wasm code did indeed come from the claimed rust code.

To do this, use the following `rust-optimizer`
(or to be specific in our case - `workspace-optimizer`), a docker image to
produce an extremely small build output in a consistent manner. From the
base of your cloned repository, run the `workspace-optimizer` container:

```sh
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/workspace-optimizer:0.11.4
```

This produces an `./artifacts` directory in the root of the workspace. It contains the compiled and optimized WebAssembly output of the contracts along with a Sha256 checksum in `./artifacts/checksums.txt`.


### Deploying and Instantiating Price Consumer Contract, and Reading the Latest Price

This example uses the `readLatestPrice.mjs` script to deploy, instantiate,
and read the Price Consumer Contract.

Install the [Terra.js](https://terra-money.github.io/terra.js/#installation)
package, which supports several wallet functions in the script:

```sh
npm install @terra-money/terra.js
```

Export your wallet seed phrase to the TERRA_SEED environment variable.
The script uses the seed phrase to determine the wallet key that you want
to use to deploy and call the smart contract.

```sh
export TERRA_SEED="YOUR SEED PHRASE"
```

Run the script:

```sh
node ./scripts/readLatestPrice.mjs
```

After the script runs, the price consumer contract should be deployed and
instantiated on the Terra testnet. The console prints the
latest LUNA/USD price.

```
{
  round_data_response: {
    round_id: 39516,
    answer: '3706000000',
    started_at: 1634497952,
    updated_at: 1634497952,
    answered_in_round: 39516
  }
}
```
