import {
  AgentPubKeyB64,
  EntryHash,
  HeaderHash,
} from "@holochain-open-dev/core-types";
import { pause, Scenario } from "@holochain/tryorama";
import test from "tape";
import { CreateMewInput, FeedMew, Mew } from "../../../ui/src/types/types";
import { clutterDna } from "../utils.js";

test("mew tests", async (t) => {
  const scenario = new Scenario();
  const [alice, bob, carol] = await scenario.addPlayersWithHapps([
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
    { dnas: [clutterDna] },
  ]);

  await scenario.shareAllAgents();

  const mewContent =
    "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
  const createMewInput: CreateMewInput = {
    mewType: {
      original: null,
    },
    text: mewContent,
  };

  // Alice creates a post
  const mewHash: HeaderHash = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: createMewInput,
  });
  t.ok(mewHash);

  await pause(777);

  console.log("searching hashtags");
  // get hashtags: #hashtag
  let hashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_mews_with_hashtag",
    payload: "#hashtag",
  });
  t.equal(hashtaggedMews.length, 1);
  console.log(hashtaggedMews[0].mew.mewType);
  t.equal(hashtaggedMews[0].mew.content?.text, mewContent);

  // get hashtags: arabic
  hashtaggedMews = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_mews_with_hashtag",
    payload: "#سعيدة",
  });
  t.equal(hashtaggedMews.length, 1);
  console.log("searching hashtags");
  console.log(hashtaggedMews[0].mew.mewType);
  t.equal(hashtaggedMews[0].mew.content?.text, mewContent);

  // get hashtags: emojis -- invalid hashtag!
  hashtaggedMews = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_mews_with_hashtag",
    payload: "#😃😃😃",
  });
  t.equal(hashtaggedMews.length, 0);

  const cashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_mews_with_cashtag",
    payload: "$cashtag",
  });
  console.log({ cashtaggedMews });
  t.equal(cashtaggedMews.length, 1);
  console.log("searching cashtags");
  console.log(cashtaggedMews[0].mew.content?.text);

  const mentionedMews: FeedMew[] = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_mews_with_mention",
    payload: "@mention",
  });
  console.log({ mentionedMews });
  t.equal(mentionedMews.length, 1);
  console.log("searching mentions");
  console.log(mentionedMews[0].mew.content?.text);

  // Bob gets the created mew
  const mew: Mew = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_mew",
    payload: mewHash,
  });
  console.log("mew", mew);
  t.deepEqual(mew, {
    mewType: { original: null },
    content: { text: mewContent },
  });

  let mews: FeedMew[] = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "mews_by",
    payload: alice.agentPubKey,
  });
  t.equal(mews[0].mew.content?.text, mewContent);
  console.log("mews:", mews);
  console.log("entry hash:", mews[0].mewEntryHash);
  console.log("mewType:", mews[0].mew.mewType);
  const originalEntryHash = mews[0].mewEntryHash;

  mews = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "mews_by",
    payload: bob.agentPubKey,
  });
  t.equal(mews.length, 0);

  mews = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "mews_feed",
    payload: { option: "" },
  });
  t.equal(mews.length, 0);

  try {
    await bob.cells[0].callZome({
      zome_name: "mews",
      fn_name: "follow",
      payload: bob.agentPubKey,
    });
    t.fail();
  } catch (e) {
    console.log("bob.my_following");
    const follow: AgentPubKeyB64[] = await bob.cells[0].callZome({
      zome_name: "mews",
      fn_name: "my_following",
    });
    console.log("bob my_following", follow, follow.length);
    t.deepEqual(follow, []);
    t.ok("error thrown");
  }

  await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "follow",
    payload: alice.agentPubKey,
  });
  await pause(777);

  console.log("Bob", bob.agentPubKey);
  console.log("Alice", alice.agentPubKey);
  console.log("Carol", carol.agentPubKey);
  console.log("alice.my_followers");
  let follow: AgentPubKeyB64[] = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "my_followers",
  });
  console.log("alices my_followers", follow, follow.length);
  t.deepEqual(follow, [bob.agentPubKey]);

  console.log("alice.my_following");
  follow = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "my_following",
  });
  console.log("alice my_following", follow, follow.length);
  t.equal(follow.length, 0);

  console.log("bob.my_following");
  follow = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "my_following",
  });
  console.log("bob my_following", follow, follow.length);
  t.deepEqual(follow, [alice.agentPubKey]);

  console.log("bob.my_followers");
  follow = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "my_followers",
  });
  console.log("bob my_followers", follow, follow.length);
  t.equal(follow.length, 0);

  follow = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "followers",
    payload: alice.agentPubKey,
  });
  t.deepEqual(follow, Buffer.from(bob.agentPubKey).toString("base64url"));

  follow = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "following",
    payload: bob.agentPubKey,
  });
  t.deepEqual(follow, Buffer.from(alice.agentPubKey).toString("base64url"));

  // after following alice, bob should get alice's mews in his feed
  mews = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "mews_feed",
    payload: { option: "" },
  });
  t.equal(mews[0].mew.content?.text, mewContent);

  // carol and alice post, bob follows carol
  // Carol creates a post
  const createMewInput2: CreateMewInput = {
    ...createMewInput,
    text: createMewInput.text + "2",
  };
  const mewHash2 = await carol.cells[0].callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: createMewInput2,
  });
  t.ok(mewHash2);

  const createMewInput3: CreateMewInput = {
    ...createMewInput,
    text: createMewInput.text + "3",
  };
  // Alice creates a post
  const mewHash3 = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: createMewInput3,
  });
  t.ok(mewHash3);

  await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "follow",
    payload: carol.agentPubKey,
  });
  await pause(777);

  // tests that mews from different followers get sorted into descending order
  mews = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "mews_feed",
    payload: { option: "" },
  });
  t.equal(mews[0].mew.content?.text, mewContent + "3");
  t.equal(mews[1].mew.content?.text, mewContent + "2");
  t.equal(mews[2].mew.content?.text, mewContent);

  await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "unfollow",
    payload: alice.agentPubKey,
  });
  await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "unfollow",
    payload: carol.agentPubKey,
  });
  // Bob unfollows all his followees
  mews = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "mews_feed",
    payload: { option: "" },
  });
  t.equal(mews.length, 0);

  // ==============================================
  // test mew interaction: lick, reply, remew, and mewmew
  // ==============================================

  // Alice licks first mew
  await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "lick_mew",
    payload: originalEntryHash,
  });
  let aliceLicks: EntryHash[] = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "my_licks",
  });
  t.equal(aliceLicks.length, 1);
  t.equal(aliceLicks[0], originalEntryHash);

  const createReplyMewInput: CreateMewInput = {
    mewType: {
      reply: originalEntryHash,
    },
    text: "reply mew to original mew!",
  };

  // Alice replies to first mew
  const replyMewHash = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: createReplyMewInput,
  });
  t.ok(replyMewHash);

  const createReMewInput: CreateMewInput = {
    mewType: {
      mewMew: originalEntryHash,
    },
    text: null,
  };

  // Alice retweets first mew
  const reMewHash = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: createReMewInput,
  });
  t.ok(reMewHash);

  const createMewMewInput: CreateMewInput = {
    mewType: {
      quote: originalEntryHash,
    },
    text: "quote of original mew!",
  };

  // Alice quote tweets first mew
  const mewMewHash = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "create_mew",
    payload: createMewMewInput,
  });
  t.ok(mewMewHash);

  await pause(777);

  // get orignal mew with context to see if links were created by interacting with it
  let mewWithContext: FeedMew = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_feed_mew_and_context",
    payload: mewHash,
  });
  console.log("mew context:", mewWithContext);
  t.equals(mewWithContext.replies.length, 1);
  t.equals(mewWithContext.quotes.length, 2);
  t.equals(mewWithContext.licks.length, 1);

  // test can get mew with entry hash in addition to header hash
  const mewFromEntryHash: Mew = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_mew",
    payload: mewWithContext.replies[0],
  });
  console.log("mew from entry hash:", mewFromEntryHash);
  t.equals(mewFromEntryHash.content?.text, createReplyMewInput.text);
  t.equals("reply" in mewFromEntryHash.mewType, true);

  mewWithContext = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_feed_mew_and_context",
    payload: originalEntryHash,
  });
  console.log("mew context:", mewWithContext);
  t.equals(mewWithContext.replies.length, 1);
  t.equals(mewWithContext.quotes.length, 2);
  t.equals(mewWithContext.licks.length, 1);

  // unlick mew
  await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "unlick_mew",
    payload: originalEntryHash,
  });
  aliceLicks = await alice.cells[0].callZome({
    zome_name: "mews",
    fn_name: "my_licks",
  });
  t.equal(aliceLicks.length, 0);

  await pause(500);
  mewWithContext = await bob.cells[0].callZome({
    zome_name: "mews",
    fn_name: "get_feed_mew_and_context",
    payload: originalEntryHash,
  });
  console.log("mew context:", mewWithContext);
  t.equals(mewWithContext.replies.length, 1);
  t.equals(mewWithContext.quotes.length, 2);
  t.equals(mewWithContext.licks.length, 0);
});
