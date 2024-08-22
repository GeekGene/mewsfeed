use hdk::prelude::*;
use holochain::{conductor::config::ConductorConfig, prelude::DnaFile, sweettest::*};
use mews_types::{Mew, MewType};

pub async fn load_dna() -> DnaFile {
  let dna_path = std::env::current_dir()
  .unwrap()
  .join("../../../workdir/mewsfeed.dna");
  SweetDnaFile::from_bundle(&dna_path).await.unwrap()
}

#[tokio::test]
async fn create_mew() {
  /*let dna = load_dna().await;
  let mut conductors: SweetConductorBatch =
  SweetConductorBatch::from_config(2, ConductorConfig::default()).await;
  let ((alice,), (bob,)) = conductors
    .setup_app("mewsfeed", &[dna])
    .await
    .unwrap()
    .into_tuples();
    conductors.exchange_peer_info().await;
    
  let action_hash: ActionHash = conductors[0]
    .call(
      &alice.zome("mews"),
      "create_mew",
      Mew {
        text: "blah",
        links: vec![],
        mew_type: MewType::Original
      }
    )
    .await.unwrap();
  
  let mew_record: Record = conductors[0]
    .call(
      &alice.zome("mews"),
      "get_mew",
      action_hash
    )
    .await.unwrap().unwrap();*/

  let mew = Mew {
    text: "blah".into(),
    links: vec![],
    mew_type: MewType::Original
  };
  
  let mut buf = vec![];
  mew.serialize(&mut rmp_serde::Serializer::new(&mut buf)).unwrap();
  println!("msgpack serialized: {:?}", buf);
  
  // let deserialized = rmp_serde::as_str(serialized);
  // println!("msgpack deserialized: {}", deserialized);

  let serialized = serde_json::to_string(&mew).unwrap();
  println!("json serialized: {}", serialized);
  let deserialized: Mew = serde_json::from_str(serialized.as_str()).unwrap();
  println!("json deserialized: {:?}", deserialized);

}