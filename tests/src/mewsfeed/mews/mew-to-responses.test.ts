import { ActionHash } from "@holochain/client";
import { runScenario } from "@holochain/tryorama";
import { assert, expect, it } from "vitest";
import { FeedMew, Mew, MewTypeName } from "../../../../ui/src/types/types.js";
import { mewsfeedAppBundleSource } from "../../common.js";

it("Agent can reply to a mew", async () => {
  await runScenario(async (scenario) => {
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
      mew_type: { type: MewTypeName.Original },
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
      mew_type: { type: MewTypeName.Reply, original_action_hash: action_hash },
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
    assert.ok(MewTypeName.Reply === replyMew.mew.mew_type.type, "mew is a reply");
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
    assert.ok(
      MewTypeName.Original === originalMew.mew.mew_type.type,
      "mew is an original mew"
    );
    assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
    assert.equal(originalMew.replies_count, 1, "original mew has 1 reply");
    assert.isTrue(
      originalMew.is_replied,
      "original mew's reply is alice's reply"
    );
  }, true);
});

it("Agent can mewmew a mew, only once", async () => {
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
        mew_type: { type: MewTypeName.Original },
      };
      const action_hash: ActionHash = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: aliceMewInput,
      });

      const aliceMewmewInput: Mew = {
        text: "",
        links: [],
        mew_type: { type: MewTypeName.Mewmew, original_action_hash: action_hash },
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
      assert.ok(MewTypeName.Mewmew === mewmew.mew.mew_type.type, "mew is a mewmew");
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
      assert.ok(
        MewTypeName.Original === originalMew.mew.mew_type.type,
        "mew is an original mew"
      );
      assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      assert.equal(originalMew.mewmews_count, 1, "original mew has 1 mewmew");
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
      await expect(response).rejects.toThrowError(/InvalidCommit/);
    },
    true,
    { timeout: 500000 }
  );
});

it("Agent can quote a mew", async () => {
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
        mew_type: { type: MewTypeName.Original },
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
          type: MewTypeName.Quote,
          original_action_hash: action_hash,
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
      assert.ok(MewTypeName.Quote === quote.mew.mew_type.type, "mew is a quote");
      assert.equal(quote.mew.text, aliceQuoteText, "quote is alice's quote");

      const originalMew: FeedMew = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mew_with_context",
        payload: action_hash,
      });
      assert.ok(
        MewTypeName.Original === originalMew.mew.mew_type.type,
        "mew is an original mew"
      );
      assert.equal(originalMew.mew.text, aliceMewContent, "mew is alice's mew");
      assert.equal(originalMew.quotes_count, 1, "original mew has 1 quote");
      assert.isTrue(
        originalMew.is_quoted,
        "original mew's quote is alice's quote"
      );
    },
    true,
    { timeout: 500000 }
  );
});
