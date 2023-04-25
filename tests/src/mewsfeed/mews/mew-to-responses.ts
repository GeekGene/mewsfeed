import { Record } from "@holochain/client";
import { runScenario } from "@holochain/tryorama";
import { assert, test } from "vitest";
import { FeedMew, Mew, MewTypeName } from "../../../../ui/src/types/types.js";
import { mewsfeedAppBundleSource } from "../../utils.js";

test("Agent can reply to a mew", async () => {
  await runScenario(
    async (scenario) => {
      // Construct proper paths for your app.
      // This assumes app bundle created by the `hc app pack` command.
      const testAppPath = process.cwd() + "/../workdir/mewsfeed.happ";

      // Set up the app to be installed
      const appSource = { appBundleSource: { path: testAppPath } };

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
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      const aliceReplyContent = "alice-test-reply";
      const aliceReplyInput: Mew = {
        text: aliceReplyContent,
        links: [],
        mew_type: { [MewTypeName.Reply]: mewRecord.signed_action.hashed.hash },
      };
      const replyRecord: Record = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceReplyInput,
      });

      const replyMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: replyRecord.signed_action.hashed.hash,
      });
      assert.ok(MewTypeName.Reply in replyMew.mew.mew_type, "mew is a reply");
      assert.equal(
        replyMew.mew.text,
        aliceReplyContent,
        "reply is alice's reply"
      );

      const originalMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: mewRecord.signed_action.hashed.hash,
      });
      assert.ok(
        MewTypeName.Original in originalMew.mew.mew_type,
        "mew is an original mew"
      );
      assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      assert.ok(originalMew.replies.length === 1, "original mew has 1 reply");
      assert.deepEqual(
        originalMew.replies[0],
        replyRecord.signed_action.hashed.hash,
        "original mew's reply is alice's reply"
      );
    },
    true,
    { timeout: 100000 }
  );
});

test("Agent can mewmew a mew", async () => {
  await runScenario(
    async (scenario) => {
      // Construct proper paths for your app.
      // This assumes app bundle created by the `hc app pack` command.
      const testAppPath = process.cwd() + "/../workdir/mewsfeed.happ";

      // Set up the app to be installed
      const appSource = { appBundleSource: { path: testAppPath } };

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
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      const aliceMewmewInput: Mew = {
        text: "",
        links: [],
        mew_type: { [MewTypeName.Mewmew]: mewRecord.signed_action.hashed.hash },
      };
      const mewmewRecord: Record = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewmewInput,
      });

      const mewmew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: mewmewRecord.signed_action.hashed.hash,
      });
      assert.ok(MewTypeName.Mewmew in mewmew.mew.mew_type, "mew is a mewmew");
      assert.deepEqual(
        mewmew.mew,
        aliceMewmewInput,
        "mewmew is alice's mewmew"
      );

      const originalMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: mewRecord.signed_action.hashed.hash,
      });
      assert.ok(
        MewTypeName.Original in originalMew.mew.mew_type,
        "mew is an original mew"
      );
      assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      assert.ok(originalMew.mewmews.length === 1, "original mew has 1 mewmew");
      assert.deepEqual(
        originalMew.mewmews[0],
        mewmewRecord.signed_action.hashed.hash,
        "original mew's mewmew is alice's mewmew"
      );
    },
    true,
    { timeout: 100000 }
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

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const aliceMewContent = "alice-test-mew";
      const aliceMewInput: Mew = {
        text: aliceMewContent,
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      };
      const mewRecord: Record = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      const aliceQuoteText = "alice-test-quote";
      const aliceQuoteInput: Mew = {
        text: aliceQuoteText,
        links: [],
        mew_type: {
          [MewTypeName.Quote]: mewRecord.signed_action.hashed.hash,
        },
      };
      const quoteRecord: Record = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceQuoteInput,
      });

      const quote: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: quoteRecord.signed_action.hashed.hash,
      });
      assert.ok(MewTypeName.Quote in quote.mew.mew_type, "mew is a quote");
      assert.equal(quote.mew.text, aliceQuoteText, "quote is alice's quote");

      const originalMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: mewRecord.signed_action.hashed.hash,
      });
      assert.ok(
        MewTypeName.Original in originalMew.mew.mew_type,
        "mew is an original mew"
      );
      assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      assert.ok(originalMew.quotes.length === 1, "original mew has 1 quote");
      assert.deepEqual(
        originalMew.quotes[0],
        quoteRecord.signed_action.hashed.hash,
        "original mew's quote is alice's quote"
      );
    },
    true,
    { timeout: 100000 }
  );
});
