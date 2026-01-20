use crate::all_mews::get_all_mew_hashes;
use crate::tag_to_mews::get_mew_hashes_for_tag;
use hc_zome_input::ZomeFnInput;
use hdk::prelude::*;
use mews_integrity::make_tag_prefix_index;

/// Select random elements from a slice using HDK's random_bytes
fn hdk_choose_multiple<T: Clone>(slice: &[T], count: usize) -> ExternResult<Vec<T>> {
    if count >= slice.len() {
        return Ok(slice.to_vec());
    }
    if count == 0 {
        return Ok(vec![]);
    }

    // Fisher-Yates partial shuffle: shuffle first `count` elements
    let mut indices: Vec<usize> = (0..slice.len()).collect();
    let random_bytes = random_bytes((count * 4) as u32)?;

    for i in 0..count {
        let byte_offset = i * 4;
        let random_u32 = u32::from_le_bytes([
            random_bytes[byte_offset],
            random_bytes[byte_offset + 1],
            random_bytes[byte_offset + 2],
            random_bytes[byte_offset + 3],
        ]);
        let j = i + (random_u32 as usize) % (slice.len() - i);
        indices.swap(i, j);
    }

    Ok(indices[..count].iter().map(|&i| slice[i].clone()).collect())
}

#[hdk_extern]
pub fn get_random_mew_hashes(input: ZomeFnInput<usize>) -> ExternResult<Vec<ActionHash>> {
    let hashes = get_all_mew_hashes()?;

    hdk_choose_multiple(&hashes, input.input)
}

#[hdk_extern]
pub fn get_random_tags(input: ZomeFnInput<usize>) -> ExternResult<Vec<String>> {
    let prefix_index = make_tag_prefix_index()?;

    prefix_index.get_random_results(input.input)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetRandomMewsForTagInput {
    tag: String,
    count: usize,
}
#[hdk_extern]
pub fn get_random_mew_hashes_for_tag(
    input: ZomeFnInput<GetRandomMewsForTagInput>,
) -> ExternResult<Vec<ActionHash>> {
    let strategy = input.get_strategy();
    let inner = input.input;
    let hashes = get_mew_hashes_for_tag(inner.tag, .., None, strategy)?;

    hdk_choose_multiple(&hashes, inner.count)
}
