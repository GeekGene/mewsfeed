use hdk::prelude::*;
use mews_integrity::{make_prefix_path, LinkTypes};

pub fn add_to_prefix_index<T, E, H>(text: String, hash: H, link_type: T) -> ExternResult<()> 
where
  ScopedLinkType: TryFrom<T, Error = E>,
  WasmError: From<E>,
  AnyLinkableHash: From<H>
{
  let prefix_path = get_prefix_path(text.clone())?;
  
  create_link(
    prefix_path.path_entry_hash()?,
    hash,
    link_type,
    LinkTag::new(text.as_bytes())
  )?;

  Ok(())
}

fn get_prefix_path(text: String) -> ExternResult<Path> {
  let prefix_path = make_prefix_path(text)?;
  let typed_path = prefix_path.clone().typed(LinkTypes::PrefixIndex)?;
  typed_path.ensure()?;

  Ok(prefix_path)
}