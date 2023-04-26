use hdk::prelude::*;
use prefix_index_integrity::{LinkTypes, make_prefix_path};

pub fn add_hash_for_prefix_index<T, E, H>(text: String, hash: H, link_type: T) -> ExternResult<()>
where
    ScopedLinkType: TryFrom<T, Error = E>,
    WasmError: From<E>,
    AnyLinkableHash: From<H>,
{
    let index_path: Path = make_prefix_path(text.clone())?;
    enusre_prefix_index_path(index_path.clone())?;

    // Link from prefix path to hash
    create_link(
        index_path.path_entry_hash()?,
        hash,
        link_type,
        LinkTag::new(text.as_bytes()),
    )?;

    Ok(())
}

pub fn remove_hash_for_prefix_index(text: String, hash: AnyLinkableHash) -> ExternResult<()> {
    let index_path: Path = make_prefix_path(text.clone())?;

    let links = get_links(index_path.path_entry_hash()?, .., None)?;

    for link in links {
        if link.target.clone().eq(&hash) {
            delete_link(link.create_link_hash)?;
        }
    }

    Ok(())
}

fn enusre_prefix_index_path(index_path: Path) -> ExternResult<()> {
    // Ensure prefix path exists
    let typed_path = index_path.clone().typed(LinkTypes::PrefixIndex)?;
    typed_path.ensure()?;

    Ok(())
}