use crate::follower_to_creators::GetCreatorsForFollowerInput;
use crate::mew_with_context::get_batch_mews_with_context_internal;
use hc_link_pagination::{paginate_by_hash, HashPagination};
use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, SerializedBytes, Clone, Debug)]
pub struct GetFollowedCreatorsMewsInput {
    pub agent: AgentPubKey,
    pub page: Option<HashPagination>,
}
#[hdk_extern]
pub fn get_followed_creators_mews(
    input: ZomeFnInput<GetFollowedCreatorsMewsInput>,
) -> ExternResult<Vec<Record>> {
    let strategy = input.get_strategy();
    let get_options = input.get_options();
    let hashes = get_followed_creators_mew_hashes(input.input, strategy)?;
    let get_input: Vec<GetInput> = hashes
        .into_iter()
        .map(|hash| GetInput::new(hash.into(), get_options.clone()))
        .collect();
    let records = HDK.with(|hdk| hdk.borrow().get(get_input))?;
    let records: Vec<Record> = records.into_iter().flatten().collect();

    Ok(records)
}

#[hdk_extern]
pub fn get_followed_creators_mews_with_context(
    input: ZomeFnInput<GetFollowedCreatorsMewsInput>,
) -> ExternResult<Vec<FeedMew>> {
    let strategy = input.get_strategy();
    let get_options = input.get_options();
    let hashes = get_followed_creators_mew_hashes(input.input, strategy)?;

    get_batch_mews_with_context_internal(hashes, get_options)
}

fn get_followed_creators_mew_hashes(
    input: GetFollowedCreatorsMewsInput,
    strategy: GetStrategy,
) -> ExternResult<Vec<ActionHash>> {
    let mut creators: Vec<AgentPubKey> =
        crate::follower_to_creators::get_creators_for_follower(ZomeFnInput::new(
            GetCreatorsForFollowerInput {
                follower: input.agent.clone(),
                page: None,
            },
            Some(strategy == GetStrategy::Local),
        ))?;
    creators.push(input.agent);

    let links: Vec<Link> = creators
        .into_iter()
        .filter_map(|agent| {
            get_links(
                LinkQuery::new(
                    AnyLinkableHash::from(agent),
                    LinkTypes::AgentMews.try_into_filter().ok().unwrap(),
                ),
                strategy,
            )
            .ok()
        })
        .flatten()
        .collect();
    let links_page = paginate_by_hash(links, input.page)?;

    let hashes: Vec<ActionHash> = links_page
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();

    Ok(hashes)
}

#[hdk_extern]
pub fn get_followed_creators_mew_hashes_extern(
    input: ZomeFnInput<GetFollowedCreatorsMewsInput>,
) -> ExternResult<Vec<ActionHash>> {
    let strategy = input.get_strategy();
    get_followed_creators_mew_hashes(input.input, strategy)
}

#[hdk_extern]
pub fn get_my_followed_creators_mews_with_context(
    input: ZomeFnInput<Option<HashPagination>>,
) -> ExternResult<Vec<FeedMew>> {
    let strategy = input.get_strategy();
    let get_options = input.get_options();
    let hashes = get_followed_creators_mew_hashes(
        GetFollowedCreatorsMewsInput {
            agent: agent_info()?.agent_initial_pubkey,
            page: input.input,
        },
        strategy,
    )?;

    get_batch_mews_with_context_internal(hashes, get_options)
}
