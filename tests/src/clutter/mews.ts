
import { Orchestrator, Player, Cell } from "@holochain/tryorama";
import { config, installation, sleep } from '../utils';
import { serializeHash } from '@holochain-open-dev/core-types';


export default (orchestrator: Orchestrator<any>) =>
  orchestrator.registerScenario("mews tests", async (s, t) => {
    // Declare two players using the previously specified config, nicknaming them "alice" and "bob"
    // note that the first argument to players is just an array conductor configs that that will
    // be used to spin up the conductor processes which are returned in a matching array.
    const [alice_player, bob_player, carol_player]: Player[] = await s.players([config, config, config]);

    // install your happs into the conductors and destructuring the returned happ data using the same
    // array structure as you created in your installation array.
    const [[alice_happ]] = await alice_player.installAgentsHapps(installation);
    const [[bob_happ]] = await bob_player.installAgentsHapps(installation);
    const [[carol_happ]] = await carol_player.installAgentsHapps(installation);

    await s.shareAllNodes([alice_player, bob_player, carol_player]);

    const alice = alice_happ.cells.find(cell => cell.cellRole.includes('/clutter.dna')) as Cell;
    const bob = bob_happ.cells.find(cell => cell.cellRole.includes('/clutter.dna')) as Cell;
    const carol = carol_happ.cells.find(cell => cell.cellRole.includes('/clutter.dna')) as Cell;

    const mewContents = "My Mew with #hashtag and $cashtag";

    // Alice creates a post
    const mewHash = await alice.call(
      "mews",
      "create_mew",
      mewContents
    );
    t.ok(mewHash);

    await sleep(250);

    const hashtaggedMews = await alice.call(
      "mews",
      "get_mews_with_hashtag",
      "#hashtag"
    );
    t.equal(hashtaggedMews.length, 1)
    console.log('searching hashtags')
    console.log(hashtaggedMews[0].entry)

    const cashtaggedMews = await alice.call(
      "mews",
      "get_mews_with_cashtag",
      "$cashtag"
    );
    t.equal(cashtaggedMews.length, 1)
    console.log('searching cashtags')
    console.log(cashtaggedMews[0].entry)
    // Bob gets the created mew
    const mew = await bob.call("mews", "get_mew", mewHash);
    t.equal(mew, mewContents);

    let alicePubKey = serializeHash(alice.cellId[1])
    let bobPubKey = serializeHash(bob.cellId[1])
    let carolPubKey = serializeHash(carol.cellId[1])

    let mews = await bob.call("mews", "mews_by", alicePubKey)
    t.equal(mews[0].entry, mewContents);

    mews = await bob.call("mews", "mews_by", bobPubKey)
    t.equal(mews.length, 0);

    mews = await bob.call("mews", "mews_feed", { option: "" })
    t.equal(mews.length, 0);

    await bob.call("mews", "follow", alicePubKey)
    t.ok
    await sleep(250);

    console.log("Bob", bobPubKey)
    console.log("Alice", alicePubKey)
    console.log("Carol", carolPubKey)
    console.log("alice.my_followers")
    let follow = await alice.call("mews", "my_followers", null)
    console.log("alices my_followers", follow, follow.length)
    t.deepEqual(follow, [bobPubKey])

    console.log("alice.my_following")
    follow = await alice.call("mews", "my_following", null)
    console.log("alice my_following", follow, follow.length)
    sleep(250)
    t.equal(follow.length, 0)

    console.log("bob.my_following")
    follow = await bob.call("mews", "my_following", null)
    console.log("bob my_following", follow, follow.length)
    t.deepEqual(follow, [alicePubKey])

    console.log("bob.my_followers")
    follow = await bob.call("mews", "my_followers", null)
    console.log("bob my_followers", follow, follow.length)
    t.equal(follow.length, 0)

    follow = await alice.call("mews", "followers", alicePubKey)
    t.deepEqual(follow, [bobPubKey])

    follow = await alice.call("mews", "following", bobPubKey)
    t.deepEqual(follow, [alicePubKey])

    // after following alice bob should get alice's mews in his feed
    mews = await bob.call("mews", "mews_feed", { option: "" })
    t.equal(mews[0].entry, mewContents);

    // carol and alice post, bob follows carol
    // Carol creates a post
    const mewHash2 = await carol.call(
      "mews",
      "create_mew",
      mewContents + "2"
    );
    t.ok(mewHash2);

    // Alice creates a post
    const mewHash3 = await alice.call(
      "mews",
      "create_mew",
      mewContents + "3"
    );
    t.ok(mewHash2);

    await bob.call("mews", "follow", carolPubKey)
    t.ok
    await sleep(250);

    // tests that mews from different followers get sorted into the correct order
    mews = await bob.call("mews", "mews_feed", { option: "" })
    t.equal(mews.length, 3);
    t.equal(mews[1].entry, mewContents + "2");
    t.equal(mews[2].entry, mewContents + "3");

  });
