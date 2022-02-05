
import { Orchestrator, Player, Cell } from "@holochain/tryorama";
import { config, installation, sleep } from '../utils';
import { serializeHash } from '@holochain-open-dev/core-types';


function getMewContents(fullMew: any): string {
  return fullMew.mew.mewType.original.mew
}

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

    const mewContents = "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag";

    // Alice creates a post
    const mewHash = await alice.call(
      "mews",
      "create_mew",
      mewContents
    );
    t.ok(mewHash);

    await sleep(777);

    // get hashtags: #hashtag
    let hashtaggedMews = await alice.call(
      "mews",
      "get_mews_with_hashtag",
      "#hashtag"
    );
    t.equal(hashtaggedMews.length, 1)
    console.log('searching hashtags')
    console.log(hashtaggedMews[0].mew.mewType.original)
    t.equal(getMewContents(hashtaggedMews[0]), mewContents);

    // get hashtags: arabic
    hashtaggedMews = await alice.call(
      "mews",
      "get_mews_with_hashtag",
      "#سعيدة"
    );
    t.equal(hashtaggedMews.length, 1)
    console.log('searching hashtags')
    console.log(hashtaggedMews[0].mew.mewType.original)
    t.equal(getMewContents(hashtaggedMews[0]), mewContents);

    // get hashtags: emojis -- invalid hashtag!
    hashtaggedMews = await alice.call(
      "mews",
      "get_mews_with_hashtag",
      "#😃😃😃"
    );
    t.equal(hashtaggedMews.length, 0)

    const cashtaggedMews = await alice.call(
      "mews",
      "get_mews_with_cashtag",
      "$cashtag"
    );
    console.log({ cashtaggedMews })
    t.equal(cashtaggedMews.length, 1)
    console.log('searching cashtags')
    console.log(getMewContents(cashtaggedMews[0]))

    // Bob gets the created mew
    const mew = await bob.call("mews", "get_mew", mewHash);
    console.log("mew", mew)
    t.deepEqual(mew, { mewType: { original: { mew: mewContents } }, mew: null });

    let alicePubKey = serializeHash(alice.cellId[1])
    let bobPubKey = serializeHash(bob.cellId[1])
    let carolPubKey = serializeHash(carol.cellId[1])

    let mews = await bob.call("mews", "mews_by", alicePubKey)
    t.equal(getMewContents(mews[0]), mewContents);

    mews = await bob.call("mews", "mews_by", bobPubKey)
    t.equal(mews.length, 0);

    mews = await bob.call("mews", "mews_feed", { option: "" })
    t.equal(mews.length, 0);

    await bob.call("mews", "follow", alicePubKey)
    await sleep(777);

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
    t.equal(getMewContents(mews[0]), mewContents);

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
    t.ok(mewHash3);

    await bob.call("mews", "follow", carolPubKey)
    await sleep(777);

    // tests that mews from different followers get sorted into descending order
    mews = await bob.call("mews", "mews_feed", { option: "" })
    t.equal(getMewContents(mews[0]), mewContents + "3");
    t.equal(getMewContents(mews[1]), mewContents + "2");
    t.equal(getMewContents(mews[2]), mewContents);

    await bob.call("mews", "unfollow", alicePubKey);
    await bob.call("mews", "unfollow", carolPubKey);
    // Bob unfollows all his followees
    mews = await bob.call("mews", "mews_feed", { option: "" })
    t.equal(mews.length, 0);
  });
