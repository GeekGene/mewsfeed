use crate::mew_with_context::get_batch_mews_with_context_internal;
use hc_link_pagination::{paginate_by_hash, HashPagination};
use hc_zome_input::ZomeFnInput;
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

#[derive(Serialize, Deserialize, Debug)]
pub struct GetMewsForMentionInput {
    pub mention: AgentPubKey,
    pub page: Option<HashPagination>,
}
#[hdk_extern]
pub fn get_mews_for_mention(input: ZomeFnInput<GetMewsForMentionInput>) -> ExternResult<Vec<Record>> {
    let strategy = input.get_strategy();
    let get_options = input.get_options();
    let hashes = get_mew_hashes_for_mention(input.input.mention, input.input.page, strategy)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), get_options.clone()))
        .collect();

    // Get the records to filter out the deleted ones
    let records: Vec<Record> = HDK
        .with(|hdk| hdk.borrow().get(get_input))?
        .into_iter()
        .flatten()
        .collect();

    Ok(records)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetMewsForMentionWithContextInput {
    pub mention: AgentPubKey,
    pub page: Option<HashPagination>,
}
#[hdk_extern]
pub fn get_mews_for_mention_with_context(
    input: ZomeFnInput<GetMewsForMentionWithContextInput>,
) -> ExternResult<Vec<FeedMew>> {
    let strategy = input.get_strategy();
    let get_options = input.get_options();
    let hashes = get_mew_hashes_for_mention(input.input.mention, input.input.page, strategy)?;

    get_batch_mews_with_context_internal(hashes, get_options)
}

fn get_mew_hashes_for_mention(
    mention: AgentPubKey,
    page: Option<HashPagination>,
    strategy: GetStrategy,
) -> ExternResult<Vec<ActionHash>> {
    let links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(mention),
            LinkTypes::MentionToMews.try_into_filter()?,
        ),
        strategy,
    )?;
    let links_page = paginate_by_hash(links, page)?;

    let hashes: Vec<ActionHash> = links_page
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
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
    let links = get_links(
        LinkQuery::new(
            AnyLinkableHash::from(input.base_mention),
            LinkTypes::MentionToMews.try_into_filter()?,
        ),
        GetStrategy::Local,
    )?;

    for link in links {
        let action_hash =
            ActionHash::try_from(link.target.clone()).map_err(|err| wasm_error!(err))?;
        if action_hash.eq(&input.target_mew_hash) {
            delete_link(link.create_link_hash, GetOptions::local())?;
        }
    }

    Ok(())
}
