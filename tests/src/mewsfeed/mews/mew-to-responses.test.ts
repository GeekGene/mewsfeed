import { runScenario } from "@holochain/tryorama";
import { assert, expect, test } from "vitest";
import { FeedMew, Mew, MewTypeName } from "../../../../ui/src/types/types.js";
import { mewsfeedAppBundleSource } from "../../common.js";
import { ActionHash } from "@holochain/client";

test("Agent can reply to a mew", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice] = await scenario.addPlayersWithApps([appSource]);

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: MewTypeName.Original,
      };
      const action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      const aliceReplyContent = "alice-test-reply";
      const aliceReplyInput: Mew = {
        text: aliceReplyContent,
        links: [],
        mew_type: { [MewTypeName.Reply]: action_hash },
      };
      const reply_action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceReplyInput,
      });

      const replyMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: reply_action_hash,
      });
      assert.ok(
        typeof replyMew.mew.mew_type === "object" &&
          MewTypeName.Reply in replyMew.mew.mew_type,
        "mew is a reply"
      );
      assert.equal(
        replyMew.mew.text,
        aliceReplyContent,
        "reply is alice's reply"
      );

      const originalMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: action_hash,
      });
      console.log("original", originalMew.mew.mew_type);
      assert.equal(
        originalMew.mew.mew_type,
        MewTypeName.Original,
        "mew is an original mew"
      );
      assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      assert.ok(originalMew.replies_count === 1, "original mew has 1 reply");
      assert.isTrue(
        originalMew.is_replied,
        "original mew's reply is alice's reply"
      );
    },
    true,
    { timeout: 500000 }
  );
});

test("Agent can mewmew a mew only once", async () => {
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

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: MewTypeName.Original,
      };
      const action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      const aliceMewmewInput: Mew = {
        text: "",
        links: [],
        mew_type: { [MewTypeName.Mewmew]: action_hash },
      };
      const mewmew_action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewmewInput,
      });

      const mewmew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: mewmew_action_hash,
      });
      assert.ok(
        typeof mewmew.mew.mew_type === "object" &&
          MewTypeName.Mewmew in mewmew.mew.mew_type,
        "mew is a mewmew"
      );
      assert.deepEqual(
        mewmew.mew,
        aliceMewmewInput,
        "mewmew is alice's mewmew"
      );

      const originalMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: action_hash,
      });
      assert.equal(
        originalMew.mew.mew_type,
        MewTypeName.Original,
        "mew is an original mew"
      );
      assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      assert.ok(originalMew.mewmews_count === 1, "original mew has 1 mewmew");
      assert.isTrue(
        originalMew.is_mewmewed,
        "original mew's mewmew is alice's mewmew"
      );

      // Mewmew the same mew again
      const response = alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewmewInput,
      });
      await expect(response).rejects.toHaveProperty(
        "message",
        expect.stringContaining("InvalidCommit")
      );
    },
    true,
    { timeout: 500000 }
  );
});

test("Agent can quote a mew", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice] = await scenario.addPlayersWithApps([appSource]);

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: MewTypeName.Original,
      };
      const action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      const aliceQuoteText = "alice-test-quote";
      const aliceQuoteInput: Mew = {
        text: aliceQuoteText,
        links: [],
        mew_type: {
          [MewTypeName.Quote]: action_hash,
        },
      };
      const quote_action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceQuoteInput,
      });

      const quote: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: quote_action_hash,
      });
      assert.ok(
        typeof quote.mew.mew_type === "object" &&
          MewTypeName.Quote in quote.mew.mew_type,
        "mew is a quote"
      );
      assert.equal(quote.mew.text, aliceQuoteText, "quote is alice's quote");

      const originalMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: action_hash,
      });
      assert.equal(
        originalMew.mew.mew_type,
        MewTypeName.Original,
        "mew is an original mew"
      );
      assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      assert.ok(originalMew.quotes_count === 1, "original mew has 1 quote");
      assert.isTrue(
        originalMew.is_quoted,
        "original mew's quote is alice's quote"
      );
    },
    true,
    { timeout: 500000 }
  );
});
