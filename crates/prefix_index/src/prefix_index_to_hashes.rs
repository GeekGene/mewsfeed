use hdk::prelude::*;
use crate::PREFIX_INDEX_WIDTH;


pub fn add_hash_for_prefix_index<T, IT, E, H>(
    index_name: impl Into<String>,
    index_link_type: IT,
    text: impl Into<String> + Clone, 
    hash: H, 
    link_type: T,
) -> ExternResult<()>
where
    ScopedLinkType: TryFrom<T, Error = E>,
    ScopedLinkType: TryFrom<IT, Error = E>,
    WasmError: From<E>,
    AnyLinkableHash: From<H>,
{
    let index_path = make_prefix_path(index_name, text.clone())?;
    ensure_prefix_path(index_path.clone(), index_link_type)?;

    create_link(
        index_path.path_entry_hash()?,
        hash,
        link_type,
        LinkTag::new(text.into().as_bytes()),
    )?;

    Ok(())
}

pub fn remove_hash_for_prefix_index(
    index_name: impl Into<String>, 
    text: impl Into<String>, 
    hash: AnyLinkableHash
) -> ExternResult<()> {    
    let links = get_links_for_prefix(index_name, text, ..)?;
    for link in links {
        if link.target.clone().eq(&hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

pub fn get_tags_for_prefix(
    index_name: impl Into<String>,
    text: impl Into<String>,
    link_type: impl LinkTypeFilterExt
) -> ExternResult<Vec<String>> {
    let links = get_links_for_prefix(index_name, text, link_type)?;
    let tags: Vec<String> = links
        .into_iter()
        .filter_map(|l| decode_string_from_tag(l.tag).ok())
        .collect();

    Ok(tags)
}

pub fn get_hashes_for_prefix(
    index_name: impl Into<String>,
    text: impl Into<String>,
    link_type: impl LinkTypeFilterExt
) -> ExternResult<Vec<AnyLinkableHash>> {
    let links = get_links_for_prefix(index_name, text, link_type)?;
    let hashes: Vec<AnyLinkableHash> = links
        .into_iter()
        .map(|l| l.target)
        .collect();

    Ok(hashes)
}

pub fn get_links_for_prefix(
    index_name: impl Into<String>, 
    text: impl Into<String>,
    link_type: impl LinkTypeFilterExt
) -> ExternResult<Vec<Link>> {
    let index_path: Path = make_prefix_path(index_name, text)?;
    let links = get_links(index_path.path_entry_hash()?, link_type, None)?;
    
    Ok(links)
}

pub fn make_prefix_path(
    index_name: impl Into<String>, 
    text: impl Into<String>
) -> ExternResult<Path> {
    let prefix: String = text.into()
        .to_lowercase()
        .chars()
        .take(*PREFIX_INDEX_WIDTH)
        .collect();
    let path = Path::from(format!("{}.{}", index_name.into(), prefix));

    Ok(path)
}

fn ensure_prefix_path<IT, E>(
    path: Path, 
    index_link_type: IT,
) -> ExternResult<()> 
where
    ScopedLinkType: TryFrom<IT, Error = E>,
    WasmError: From<E>,
{
    let typed_path = path.typed(index_link_type)?;
    typed_path.ensure()?;

    Ok(())
}

fn decode_string_from_tag(tag: LinkTag) -> ExternResult<String> {
    String::from_utf8(tag.into_inner()).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to convert link tag to string".into()
        ))
    })
}