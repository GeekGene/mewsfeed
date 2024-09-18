import { ActionHash } from "@holochain/client";
import { runScenario } from "@holochain/tryorama";
import { assert, expect, it } from "vitest";
import {
  FeedMew,
  LinkTargetName,
  Mew,
  MewTypeName,
  PaginationDirectionName,
} from "../../../../ui/src/types/types.js";
import { mewsfeedAppBundleSource } from "../../common.js";

it("Hashtag, cashtag and mention", async () => {
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
        mew_type: { type: MewTypeName.Original },
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

      const hashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: {
          hashtag: "#hashtag",
        },
      });
      assert.equal(hashtaggedMews.length, 1, "one mew with hashtag");
      assert.equal(
        hashtaggedMews[0].mew.text,
        mewContent,
        "mew content matches"
      );

      const arabicHashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: {
          hashtag: "#سعيدة",
        },
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
        payload: {
          hashtag: "#😃😃😃",
        },
      });
      assert.equal(emojiHashtaggedMews.length, 0, "no mew with emoji hashtag");

      const cashtaggedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_cashtag_with_context",
        payload: {
          cashtag: "$cashtag",
        },
      });
      assert.equal(cashtaggedMews.length, 1, "one mew with cashtag");

      const mentionedMews: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_mention_with_context",
        payload: {
          mention: alice.agentPubKey,
        },
      });
      assert.equal(mentionedMews.length, 1, "one mew with mention");
    },
    true,
    { timeout: 500000 }
  );
});

it("Prefix index should return hashtags and cashtags", async () => {
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
        mew_type: { type: MewTypeName.Original },
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

      const hashtags: string[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "search_tags",
        payload: {
          query: "has",
          limit: 10,
        },
      });
      assert.equal(hashtags.length, 1, "one hashtag");
      assert.equal(hashtags[0], "#hashtag", "hashtag search result matches");

      const arabicHashtags: string[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "search_tags",
        payload: {
          query: "سعيدة",
          limit: 10,
        },
      });
      assert.equal(arabicHashtags.length, 1, "one arabic hashtag");
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
      assert.equal(emojiHashtags.length, 0, "no emoji hashtags");

      const cashtags: string[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "search_tags",
        payload: {
          query: "cas",
          limit: 10,
        },
      });
      assert.equal(cashtags.length, 1, "one cashtag");
      assert.equal(cashtags[0], "$cashtag", "hashtag search result matches");
    },
    true,
    { timeout: 500000 }
  );
});

it("Hashtags list are time-paginated", async () => {
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

      const mewContent1 = "My Mew with #hashtag 1";
      const createMewInput1: Mew = {
        text: mewContent1,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash1 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput1,
      });

      const mewContent2 = "My Mew with #hashtag 2";
      const createMewInput2: Mew = {
        text: mewContent2,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash2 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput2,
      });

      const mewContent3 = "My Mew with #hashtag 3";
      const createMewInput3: Mew = {
        text: mewContent3,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash3 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput3,
      });

      const mewContent4 = "My Mew with #hashtag 4";
      const createMewInput4: Mew = {
        text: mewContent4,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash4 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput4,
      });

      const mewContent5 = "My Mew with #hashtag 5";
      const createMewInput5: Mew = {
        text: mewContent5,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash5 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput5,
      });

      const mewContent6 = "My Mew with #hashtag 6";
      const createMewInput6: Mew = {
        text: mewContent6,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash6 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput6,
      });

      const mewContent7 = "My Mew with #hashtag 7";
      const createMewInput7: Mew = {
        text: mewContent7,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash7 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput7,
      });

      const page1: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: {
          hashtag: "#hashtag",
          page: {
            limit: 2,
          },
        },
      });

      assert.deepEqual(page1[0].action_hash, mewActionHash7);
      assert.deepEqual(page1[1].action_hash, mewActionHash6);
      expect(page1[0].action.timestamp).greaterThanOrEqual(
        page1[1].action.timestamp
      );

      const page2: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: {
          hashtag: "#hashtag",
          page: {
            after_hash: page1[page1.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.deepEqual(page2[0].action_hash, mewActionHash5);
      assert.deepEqual(page2[1].action_hash, mewActionHash4);

      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp);

      const page3: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: {
          hashtag: "#hashtag",
          page: {
            after_hash: page2[page1.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.deepEqual(page3[0].action_hash, mewActionHash3);
      assert.deepEqual(page3[1].action_hash, mewActionHash2);

      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp)
        .greaterThanOrEqual(page3[0].action.timestamp)
        .greaterThanOrEqual(page3[1].action.timestamp);

      const page4: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: {
          hashtag: "#hashtag",
          page: {
            after_hash: page3[page1.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.lengthOf(page4, 1);
      assert.deepEqual(page4[0].action_hash, mewActionHash1);

      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp)
        .greaterThanOrEqual(page3[0].action.timestamp)
        .greaterThanOrEqual(page3[1].action.timestamp)
        .greaterThanOrEqual(page4[0].action.timestamp);

      const page5: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_hashtag_with_context",
        payload: {
          hashtag: "#hashtag",
          page: {
            after_hash: page4[page4.length - 1].action_hash,
            limit: 2,
          },
        },
      });

      assert.lengthOf(page5, 0);
    },
    true,
    { timeout: 500000 }
  );
});

it("Cashtags list are time-paginated", async () => {
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

      const mewContent1 = "My Mew with $cashtag 1";
      const createMewInput1: Mew = {
        text: mewContent1,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash1 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput1,
      });

      const mewContent2 = "My Mew with $cashtag 2";
      const createMewInput2: Mew = {
        text: mewContent2,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash2 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput2,
      });

      const mewContent3 = "My Mew with $cashtag 3";
      const createMewInput3: Mew = {
        text: mewContent3,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash3 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput3,
      });

      const mewContent4 = "My Mew with $cashtag 4";
      const createMewInput4: Mew = {
        text: mewContent4,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash4 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput4,
      });

      const mewContent5 = "My Mew with $cashtag 5";
      const createMewInput5: Mew = {
        text: mewContent5,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash5 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput5,
      });

      const mewContent6 = "My Mew with $cashtag 6";
      const createMewInput6: Mew = {
        text: mewContent6,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash6 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput6,
      });

      const mewContent7 = "My Mew with $cashtag 7";
      const createMewInput7: Mew = {
        text: mewContent7,
        links: [],
        mew_type: { type: MewTypeName.Original },
      };
      const mewActionHash7 = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput7,
      });

      const page1: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_cashtag_with_context",
        payload: {
          cashtag: "$cashtag",
          page: {
            start_time: null,
            limit: 2,
            order: { [PaginationDirectionName.Ascending]: null },
          },
        },
      });

      assert.deepEqual(page1[0].action_hash, mewActionHash7);
      assert.deepEqual(page1[1].action_hash, mewActionHash6);
      expect(page1[0].action.timestamp).greaterThanOrEqual(
        page1[1].action.timestamp
      );

      const page2: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_cashtag_with_context",
        payload: {
          cashtag: "$cashtag",
          page: {
            after_hash: page1[page1.length - 1].action_hash,
            limit: 2,
            order: { [PaginationDirectionName.Ascending]: null },
          },
        },
      });

      assert.deepEqual(page2[0].action_hash, mewActionHash5);
      assert.deepEqual(page2[1].action_hash, mewActionHash4);

      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp);

      const page3: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_cashtag_with_context",
        payload: {
          cashtag: "$cashtag",
          page: {
            after_hash: page2[page2.length - 1].action_hash,
            limit: 2,
            order: { [PaginationDirectionName.Ascending]: null },
          },
        },
      });

      assert.deepEqual(page3[0].action_hash, mewActionHash3);
      assert.deepEqual(page3[1].action_hash, mewActionHash2);

      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp)
        .greaterThanOrEqual(page3[0].action.timestamp)
        .greaterThanOrEqual(page3[1].action.timestamp);

      const page4: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_cashtag_with_context",
        payload: {
          cashtag: "$cashtag",
          page: {
            after_hash: page3[page3.length - 1].action_hash,
            limit: 2,
            order: { [PaginationDirectionName.Ascending]: null },
          },
        },
      });

      assert.lengthOf(page4, 1);
      assert.deepEqual(page4[0].action_hash, mewActionHash1);

      expect(page1[0].action.timestamp)
        .greaterThanOrEqual(page1[1].action.timestamp)
        .greaterThanOrEqual(page2[0].action.timestamp)
        .greaterThanOrEqual(page2[1].action.timestamp)
        .greaterThanOrEqual(page3[0].action.timestamp)
        .greaterThanOrEqual(page3[1].action.timestamp)
        .greaterThanOrEqual(page4[0].action.timestamp);

      const page5: FeedMew[] = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_cashtag_with_context",
        payload: {
          cashtag: "$cashtag",
          page: {
            after_hash: page4[page4.length - 1].action_hash,
            limit: 2,
            order: { [PaginationDirectionName.Ascending]: null },
          },
        },
      });

      assert.lengthOf(page5, 0);
    },
    true,
    { timeout: 500000 }
  );
});
