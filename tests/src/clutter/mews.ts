import { Orchestrator, Player, Cell } from "@holochain/tryorama";
import { config, installation, sleep } from "../utils";
import { CreateMewInput, FeedMew, Mew } from "../../../ui/src/types/types";
import { serializeHash } from "@holochain-open-dev/core-types";

export default (orchestrator: Orchestrator<any>) =>
  orchestrator.registerScenario("mews tests", async (s, t) => {
    // Declare two players using the previously specified config, nicknaming them "alice" and "bob"
    // note that the first argument to players is just an array conductor configs that that will
    // be used to spin up the conductor processes which are returned in a matching array.
    const [alice_player, bob_player, carol_player]: Player[] = await s.players([
      config,
      config,
      config,
    ]);

    // install your happs into the conductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    const [[alice_happ]] = await alice_player.installAgentsHapps(installation);
    const [[bob_happ]] = await bob_player.installAgentsHapps(installation);
    const [[carol_happ]] = await carol_player.installAgentsHapps(installation);

    await s.shareAllNodes([alice_player, bob_player, carol_player]);

    const alice = alice_happ.cells.find((cell) =>
      cell.cellRole.includes("/clutter.dna")
    ) as Cell;
    const bob = bob_happ.cells.find((cell) =>
      cell.cellRole.includes("/clutter.dna")
    ) as Cell;
    const carol = carol_happ.cells.find((cell) =>
      cell.cellRole.includes("/clutter.dna")
    ) as Cell;

    const mewContent =
      "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
    const createMewInput: CreateMewInput = {
      mewType: {
        original: null,
      },
      text: mewContent,
    };

    // Alice creates a post
    const mewHash = await alice.call("mews", "create_mew", createMewInput);
    t.ok(mewHash);

    await sleep(777);

    console.log("searching hashtags");
    // get hashtags: #hashtag
    let hashtaggedMews: FeedMew[] = await alice.call(
      "mews",
      "get_mews_with_hashtag",
      "#hashtag"
    );
    t.equal(hashtaggedMews.length, 1);
    console.log(hashtaggedMews[0].mew.mewType);
    t.equal(hashtaggedMews[0].mew.content?.text, mewContent);

    // get hashtags: arabic
    hashtaggedMews = await alice.call(
      "mews",
      "get_mews_with_hashtag",
      "#سعيدة"
    );
    t.equal(hashtaggedMews.length, 1);
    console.log("searching hashtags");
    console.log(hashtaggedMews[0].mew.mewType);
    t.equal(hashtaggedMews[0].mew.content?.text, mewContent);

    // get hashtags: emojis -- invalid hashtag!
    hashtaggedMews = await alice.call(
      "mews",
      "get_mews_with_hashtag",
      "#😃😃😃"
    );
    t.equal(hashtaggedMews.length, 0);

    const cashtaggedMews: FeedMew[] = await alice.call(
      "mews",
      "get_mews_with_cashtag",
      "$cashtag"
    );
    console.log({ cashtaggedMews });
    t.equal(cashtaggedMews.length, 1);
    console.log("searching cashtags");
    console.log(cashtaggedMews[0].mew.content?.text);

    const mentionedMews: FeedMew[] = await alice.call(
      "mews",
      "get_mews_with_mention",
      "@mention"
    );
    console.log({ mentionedMews });
    t.equal(mentionedMews.length, 1);
    console.log("searching mentions");
    console.log(mentionedMews[0].mew.content?.text);

    // Bob gets the created mew
    const mew: Mew = await bob.call("mews", "get_mew", mewHash);
    console.log("mew", mew);
    t.deepEqual(mew, {
      mewType: { original: null },
      content: { text: mewContent },
    });

    const alicePubKey = serializeHash(alice.cellId[1]);
    const bobPubKey = serializeHash(bob.cellId[1]);
    const carolPubKey = serializeHash(carol.cellId[1]);

    let mews: FeedMew[] = await bob.call("mews", "mews_by", alicePubKey);
    t.equal(mews[0].mew.content?.text, mewContent);
    console.log("mews:", mews);
    console.log("entry hash:", mews[0].mewEntryHash);
    console.log("mewType:", mews[0].mew.mewType);
    const originalEntryHash = mews[0].mewEntryHash;

    mews = await bob.call("mews", "mews_by", bobPubKey);
    t.equal(mews.length, 0);

    mews = await bob.call("mews", "mews_feed", { option: "" });
    t.equal(mews.length, 0);

    try {
      await bob.call("mews", "follow", bobPubKey);
      await sleep(777);
      t.fail()
    } catch(e) {
      console.log("bob.my_following");
      let follow = await bob.call("mews", "my_following", null);
      console.log("bob my_following", follow, follow.length);
      t.deepEqual(follow, []);
      t.ok("error thrown")
    }

    await bob.call("mews", "follow", alicePubKey);
    await sleep(777);

    console.log("Bob", bobPubKey);
    console.log("Alice", alicePubKey);
    console.log("Carol", carolPubKey);
    console.log("alice.my_followers");
    let follow = await alice.call("mews", "my_followers", null);
    console.log("alices my_followers", follow, follow.length);
    t.deepEqual(follow, [bobPubKey]);

    console.log("alice.my_following");
    follow = await alice.call("mews", "my_following", null);
    console.log("alice my_following", follow, follow.length);
    t.equal(follow.length, 0);

    console.log("bob.my_following");
    follow = await bob.call("mews", "my_following", null);
    console.log("bob my_following", follow, follow.length);
    t.deepEqual(follow, [alicePubKey]);

    console.log("bob.my_followers");
    follow = await bob.call("mews", "my_followers", null);
    console.log("bob my_followers", follow, follow.length);
    t.equal(follow.length, 0);

    follow = await alice.call("mews", "followers", alicePubKey);
    t.deepEqual(follow, [bobPubKey]);

    follow = await alice.call("mews", "following", bobPubKey);
    t.deepEqual(follow, [alicePubKey]);

    // after following alice bob should get alice's mews in his feed
    mews = await bob.call("mews", "mews_feed", { option: "" });
    t.equal(mews[0].mew.content?.text, mewContent);

    // carol and alice post, bob follows carol
    // Carol creates a post
    const createMewInput2: CreateMewInput = {
      ...createMewInput,
      text: createMewInput.text + "2",
    };
    const mewHash2 = await carol.call("mews", "create_mew", createMewInput2);
    t.ok(mewHash2);

    const createMewInput3: CreateMewInput = {
      ...createMewInput,
      text: createMewInput.text + "3",
    };
    // Alice creates a post
    const mewHash3 = await alice.call("mews", "create_mew", createMewInput3);
    t.ok(mewHash3);

    await bob.call("mews", "follow", carolPubKey);
    await sleep(777);

    // tests that mews from different followers get sorted into descending order
    mews = await bob.call("mews", "mews_feed", { option: "" });
    t.equal(mews[0].mew.content?.text, mewContent + "3");
    t.equal(mews[1].mew.content?.text, mewContent + "2");
    t.equal(mews[2].mew.content?.text, mewContent);

    await bob.call("mews", "unfollow", alicePubKey);
    await bob.call("mews", "unfollow", carolPubKey);
    // Bob unfollows all his followees
    mews = await bob.call("mews", "mews_feed", { option: "" });
    t.equal(mews.length, 0);

    // ==============================================
    // test mew interaction: lick, reply, remew, and mewmew
    // ==============================================

    // Alice licks first mew
    await alice.call("mews", "lick_mew", originalEntryHash);
    let aliceLicks = await alice.call("mews", "my_licks", null);
    t.equal(aliceLicks.length, 1);
    t.equal(aliceLicks[0], originalEntryHash);

    const createReplyMewInput: CreateMewInput = {
      mewType: {
        reply: originalEntryHash,
      },
      text: "reply mew to original mew!",
    };

    // Alice replies to first mew
    const replyMewHash = await alice.call(
      "mews",
      "create_mew",
      createReplyMewInput
    );
    t.ok(replyMewHash);

    const createReMewInput: CreateMewInput = {
      mewType: {
        reMew: originalEntryHash,
      },
      text: null,
    };

    // Alice retweets first mew
    const reMewHash = await alice.call("mews", "create_mew", createReMewInput);
    t.ok(reMewHash);

    const createMewMewInput: CreateMewInput = {
      mewType: {
        mewMew: originalEntryHash,
      },
      text: "mewmew of original mew!",
    };

    // Alice quote tweets first mew
    const mewMewHash = await alice.call(
      "mews",
      "create_mew",
      createMewMewInput
    );
    t.ok(mewMewHash);

    await sleep(777);

    // get orignal mew with context to see if links were created by interacting with it
    let mewWithContext: FeedMew = await bob.call(
      "mews",
      "get_feed_mew_and_context",
      mewHash
    );
    console.log("mew context:", mewWithContext);
    t.equals(mewWithContext.comments.length, 1);
    t.equals(mewWithContext.shares.length, 2);
    t.equals(mewWithContext.licks.length, 1);

    // test can get mew with entry hash in addition to header hash
    const mewFromEntryHash: Mew = await bob.call(
      "mews",
      "get_mew",
      mewWithContext.comments[0]
    );
    console.log("mew from entry hash:", mewFromEntryHash);
    t.equals(mewFromEntryHash.content?.text, createReplyMewInput.text);
    t.equals("reply" in mewFromEntryHash.mewType, true);

    mewWithContext = await bob.call(
      "mews",
      "get_feed_mew_and_context",
      originalEntryHash
    );
    console.log("mew context:", mewWithContext);
    t.equals(mewWithContext.comments.length, 1);
    t.equals(mewWithContext.shares.length, 2);
    t.equals(mewWithContext.licks.length, 1);

    // unlick mew
    await alice.call("mews", "unlick_mew", originalEntryHash);
    aliceLicks = await alice.call("mews", "my_licks", null);
    t.equal(aliceLicks.length, 0);

    await sleep(500);
    mewWithContext = await bob.call(
      "mews",
      "get_feed_mew_and_context",
      originalEntryHash
    );
    console.log("mew context:", mewWithContext);
    t.equals(mewWithContext.comments.length, 1);
    t.equals(mewWithContext.shares.length, 2);
    t.equals(mewWithContext.licks.length, 0);
  });
