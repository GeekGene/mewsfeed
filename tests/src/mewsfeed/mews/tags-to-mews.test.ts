import { ActionHash } from "@holochain/client";
import { pause, runScenario } from "@holochain/tryorama";
import { assert, test } from "vitest";
import {
  FeedMew,
  LinkTargetName,
  Mew,
  MewTypeName,
} from "../../../../ui/src/types/types.js";
import { mewsfeedAppBundleSource } from "../../common.js";

test("Hashtag, cashtag and mention", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice] = await scenario.addPlayersWithApps([appSource]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const mewContent =
        "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
      const createMewInput: Mew = {
        text: mewContent,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };

      const action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput,
      });
      assert.deepEqual(
        action_hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a valid mew"
      );

      await pause(1000);

      const hashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: "#hashtag",
      });
      assert.ok(hashtaggedMews.length === 1, "one mew with hashtag");
      assert.equal(
        hashtaggedMews[0].mew.text,
        mewContent,
        "mew content matches"
      );

      const arabicHashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: "#سعيدة",
      });
      assert.ok(
        arabicHashtaggedMews.length === 1,
        "one mew with arabic hashtag"
      );
      assert.equal(
        arabicHashtaggedMews[0].mew.text,
        mewContent,
        "mew content matches"
      );

      // get hashtag containing emojis -- invalid hashtag!
      const emojiHashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: "#😃😃😃",
      });
      assert.ok(emojiHashtaggedMews.length === 0, "no mew with emoji hashtag");

      const cashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_cashtag_with_context",
        payload: "$cashtag",
      });
      assert.ok(cashtaggedMews.length === 1, "one mew with cashtag");

      const mentionedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: alice.agentPubKey,
      });
      assert.ok(mentionedMews.length === 1, "one mew with mention");
    },
    true,
    { timeout: 100000 }
  );
});

test("Prefix index should return hashtags and cashtags", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice] = await scenario.addPlayersWithApps([appSource]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const mewContent =
        "My Mew with #hashtag #سعيدة #😃😃😃 and $cashtag and @mention";
      const createMewInput: Mew = {
        text: mewContent,
        links: [{ [LinkTargetName.Mention]: alice.agentPubKey }],
        mew_type: { [MewTypeName.Original]: null },
      };

      const action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput,
      });
      assert.deepEqual(
        action_hash.slice(0, 3),
        Buffer.from([132, 41, 36]),
        "alice created a valid mew"
      );

      await pause(1000);

      const hashtags: string[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "search_tags",
        payload: {
          query: "has",
          limit: 10,
        },
      });
      assert.ok(hashtags.length === 1, "one hashtag");
      assert.equal(hashtags[0], "#hashtag", "hashtag search result matches");

      const arabicHashtags: string[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "search_tags",
        payload: {
          query: "سعيدة",
          limit: 10,
        },
      });
      assert.ok(arabicHashtags.length === 1, "one arabic hashtag");
      assert.equal(
        arabicHashtags[0],
        "#سعيدة",
        "hashtag search result matches"
      );

      // get hashtag containing emojis -- invalid hashtag!
      const emojiHashtags: string[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "search_tags",
        payload: {
          query: "😃😃😃",
          limit: 10,
        },
      });
      assert.ok(emojiHashtags.length === 0, "no emoji hashtags");

      const cashtags: string[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "search_tags",
        payload: {
          query: "cas",
          limit: 10,
        },
      });
      assert.ok(cashtags.length === 1, "one cashtag");
      assert.equal(cashtags[0], "$cashtag", "hashtag search result matches");
    },
    true,
    { timeout: 100000 }
  );
});
