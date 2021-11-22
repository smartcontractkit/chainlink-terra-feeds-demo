import { readFileSync } from "fs";

import {
  LCDClient,
  MnemonicKey,
  MsgInstantiateContract,
  MsgStoreCode,
} from "@terra-money/terra.js";


const CONSUMER_PATH =
  "./artifacts/consumer.wasm";

// Get the wallet seed phrase from the environment variable.
const TERRA_SEED = process.env.TERRA_SEED

const mk = new MnemonicKey({
  mnemonic:
    TERRA_SEED,
});

const terra = new LCDClient({
  URL: 'https://bombay-lcd.terra.dev',
  chainID: 'bombay-12',
  gasPrices: { uluna: 0.15},
});

const wallet = terra.wallet(mk);

run();


async function run() {
  console.log("Deploying Price Consumer Contract");

  const consmCodeId = await upload(CONSUMER_PATH);
  await sleep(12000);
  console.log("instatiating contract");
  // Specify the proxy address for the asset pair that you want to retrieve.
  // See https://docs.chain.link/docs/terra-data-feeds/ for a list of feeds.
  const consmAddress = await instantiate(consmCodeId, {"proxy": "terra1u475ps69rmhpf4f4gx2pc74l7tlyu4hkj4wp9d"})
  await sleep(12000);
  console.log("reading contract");
  const result = await terra.wasm.contractQuery(consmAddress, { "get_latest_round_data": {} } )
  console.log(result);
}


async function upload(contractPath) {
  const wasm = readFileSync(contractPath);
  const tx = new MsgStoreCode(mk.accAddress, wasm.toString("base64"));
  try {
    const storeResult = await wallet
      .createAndSignTx({
        msgs: [tx],
        memo: `Storing ${contractPath}`,
      })
      .then((tx) => terra.tx.broadcast(tx));

    console.log(storeResult.raw_log);

    const codeId = extractCodeId(storeResult.raw_log);
    return codeId;
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

async function instantiate(codeId, instantiateMsg) {
  try {
    const instantiate = new MsgInstantiateContract(
      mk.accAddress,
      mk.accAddress,
      codeId,
      instantiateMsg
    );

    const instantiateResult = await wallet
      .createAndSignTx({
        msgs: [instantiate],
        memo: "Instantiating",
      })
      .then((tx) => terra.tx.broadcast(tx));

    console.log(instantiateResult.raw_log);

    return extractContractAddress(instantiateResult.raw_log);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

function extractCodeId(logs) {
  // TODO improve parsing
  const parsed = JSON.parse(logs);
  return Number(parsed[0]["events"][1]["attributes"][1]["value"]);
}

function extractContractAddress(logs) {
  const parsed = JSON.parse(logs);
  return parsed[0]["events"][0]["attributes"][3]["value"];
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default {};
