use hdk::prelude::*;

#[derive(Debug, Clone)]
#[hdk_entry(id = "self", visibility = "private")]
pub struct Myself {
    pub_key: AgentPubKeyB64,
    // data: 
}

#[derive(Debug, Clone)]
#[hdk_entry(id = "agent_store", visibility = "private")]
pub struct AgentStore {
    following: Vec<AgentPubKeyB64>,
    followers: Vec<AgentPubKeyB64>,
    //blocked: Vec<AgentPubKeyB64>,
}

