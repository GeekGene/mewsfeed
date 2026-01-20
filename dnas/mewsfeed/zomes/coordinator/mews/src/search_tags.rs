use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchTagsInput {
    pub query: String,
    pub limit: usize,
}
#[hdk_extern]
fn search_tags(input: ZomeFnInput<SearchTagsInput>) -> ExternResult<Vec<String>> {
    let prefix_index = make_tag_prefix_index()?;
    prefix_index.get_results(input.input.query, input.input.limit)
}
