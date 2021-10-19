use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map, U16Key};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Proxy {
    pub proxy_contract: string
}
