use crate::mew_with_context::get_batch_mews_with_context;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct AddMentionForMewInput {
    pub base_mention: AgentPubKey,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn add_mention_for_mew(input: AddMentionForMewInput) -> ExternResult<()> {
    create_link(
        input.base_mention,
        input.target_mew_hash,
        LinkTypes::MentionToMews,
        (),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_mews_for_mention(mention: AgentPubKey) -> ExternResult<Vec<Record>> {
    let hashes = get_mew_hashes_for_mention(mention)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), GetOptions::default()))
        .collect();

    // Get the records to filter out the deleted ones
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .flatten()
        .collect();

    Ok(records)
}

#[hdk_extern]
pub fn get_mews_for_mention_with_context(mention: AgentPubKey) -> ExternResult<Vec<FeedMew>> {
    let hashes = get_mew_hashes_for_mention(mention)?;

    get_batch_mews_with_context(hashes)
}

fn get_mew_hashes_for_mention(mention: AgentPubKey) -> ExternResult<Vec<ActionHash>> {
    let links: Vec<Link> = get_links(mention, LinkTypes::MentionToMews, None)?;

    let hashes: Vec<ActionHash> = links
        .into_iter()
        .map(|link| ActionHash::from(link.target))
        .collect();

    Ok(hashes)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RemoveMentionForMewInput {
    pub base_mention: AgentPubKey,
    pub target_mew_hash: ActionHash,
}
#[hdk_extern]
pub fn remove_mention_for_mew(input: RemoveMentionForMewInput) -> ExternResult<()> {
    let links = get_links(input.base_mention.clone(), LinkTypes::MentionToMews, None)?;

    for link in links {
        if ActionHash::from(link.target.clone()).eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}
