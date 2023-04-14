use hdi::prelude::*;

#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    MewContent(MewContent),
    Mew(Mew),
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
pub enum MewType {
    Original,
    Reply(ActionHash),
    Quote(ActionHash),
    MewMew(ActionHash),
}

#[hdk_entry_helper]
#[derive(Clone)]
pub enum LinkTarget {
    Mention(AgentPubKey),
    URL(String),
}

#[derive(Debug, Serialize, Deserialize, SerializedBytes)]
#[serde(rename_all = "camelCase")]
pub struct CreateMewInput {
    pub mew_type: MewType,
    pub text: Option<String>,
    pub links: Option<Vec<LinkTarget>>,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
#[derive(Clone)]
pub struct MewContent {
    pub text: String,
    // "Visit this web site ^link by @user about #hashtag to earn $cashtag! Also read this humm earth post ^link (as an HRL link)"
    // [^links in the mewstring in sequence]
    pub links: Option<Vec<LinkTarget>>,
    // mew_images: Vec<EntryHash>, //Vec of image links hashes to retrieve
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
pub struct Mew {
    pub mew_type: MewType,
    pub content: Option<MewContent>,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
pub struct FeedOptions {
    pub option: String,
}

#[hdk_entry_helper]
#[serde(rename_all = "camelCase")]
pub struct FeedMew {
    pub mew: Mew,
    pub action: Action,
    pub action_hash: ActionHash,
    pub replies: Vec<AnyLinkableHash>,
    pub quotes: Vec<AnyLinkableHash>,
    pub licks: Vec<AgentPubKey>,
    pub mewmews: Vec<AnyLinkableHash>,
}

#[hdk_link_types]
pub enum LinkTypes {
    Mew,
    Follow,
    Lick,
    Reply,
    Mewmew,
    Quote,
    Tag,
    TagPrefix,
}

pub const MEW_PATH_SEGMENT: &str = "mew";
pub const FOLLOWER_PATH_SEGMENT: &str = "follower";
pub const FOLLOWING_PATH_SEGMENT: &str = "following";
pub const LICK_PATH_SEGMENT: &str = "lick";
pub const REPLY_PATH_SEGMENT: &str = "reply";
pub const MEWMEW_PATH_SEGMENT: &str = "mewmew";
pub const QUOTE_PATH_SEGMENT: &str = "quote";

#[derive(Debug, Serialize, Deserialize, SerializedBytes, Clone)]
pub struct DnaProperties {
    mew_characters_min: Option<usize>,
    mew_characters_max: Option<usize>,
}

#[hdk_extern]
#[allow(clippy::collapsible_match)]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    let properties = DnaProperties::try_from(dna_info()?.properties)
        .map_err(|e| wasm_error!(WasmErrorInner::Guest(e.into())))?;

    match op.to_type::<EntryTypes, LinkTypes>().unwrap() {
        OpType::StoreEntry(entry) => match entry {
            OpEntry::CreateEntry { app_entry, .. } => match app_entry {
                EntryTypes::Mew(mew) => match mew.content {
                    None => Ok(ValidateCallbackResult::Valid),
                    Some(mew_content) => {
                        // Validate minimum mew length, if set in DNA properties
                        if let Some(mew_characters_min) = properties.mew_characters_min {
                            if mew_content.text.len() < mew_characters_min {
                                return Ok(ValidateCallbackResult::Invalid(format!(
                                    "mew must contain at least {} characters",
                                    mew_characters_min
                                )));
                            }
                        }

                        // Validate maximum mew length, if set in DNA properties
                        if let Some(mew_characters_max) = properties.mew_characters_max {
                            if mew_content.text.len() > mew_characters_max {
                                return Ok(ValidateCallbackResult::Invalid(format!(
                                    "mew must contain at most {} characters",
                                    mew_characters_max
                                )));
                            }
                        }

                        Ok(ValidateCallbackResult::Valid)
                    }
                },
                EntryTypes::MewContent(_) => Ok(ValidateCallbackResult::Valid),
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        _ => Ok(ValidateCallbackResult::Valid),
    }
}
