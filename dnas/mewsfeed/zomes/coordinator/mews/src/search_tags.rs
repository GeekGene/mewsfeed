use hdk::prelude::*;
use mews_integrity::*;

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchTagsInput {
    pub query: String,
    pub limit: usize,
}
#[hdk_extern]
fn search_tags(input: SearchTagsInput) -> ExternResult<Vec<String>> {
    let prefix_index = make_tag_prefix_index()?;
    prefix_index.get_results(input.query, input.limit)
}
