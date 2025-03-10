import { assert, expect, test } from "vitest";
import { runScenario, dhtSync } from "@holochain/tryorama";
import { Record, fakeActionHash } from "@holochain/client";
import { mewsfeedAppBundleSource } from "../../common";

test("link a Liker to a Hash", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
      ]);

      const baseAddress = alice.agentPubKey;
      const targetAddress = await fakeActionHash();

      // Bob gets the links, should be empty
      let linksOutput: Record[] = await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "get_hashes_for_liker",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Alice creates a link from Liker to Hash
      await alice.cells[0].callZome({
        zome_name: "likes",
        fn_name: "add_hash_for_liker",
        payload: {
          base_liker: baseAddress,
          target_hash: targetAddress,
        },
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "get_hashes_for_liker",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 1);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "get_likers_for_hash",
        payload: targetAddress,
      });
      assert.equal(linksOutput.length, 1);

      await alice.cells[0].callZome({
        zome_name: "likes",
        fn_name: "remove_hash_for_liker",
        payload: {
          base_liker: baseAddress,
          target_hash: targetAddress,
        },
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "get_hashes_for_liker",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "get_likers_for_hash",
        payload: targetAddress,
      });
      assert.equal(linksOutput.length, 0);
    },
    true,
    { timeout: 500000 }
  );
});

test("Agent can only change their own likes", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
      ]);

      const targetAddress = await fakeActionHash();

      // Alice likes hash
      await alice.cells[0].callZome({
        zome_name: "likes",
        fn_name: "like",
        payload: targetAddress,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob tries to remove alices' like
      const response = bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "remove_hash_for_liker",
        payload: {
          base_liker: alice.agentPubKey,
          target_hash: targetAddress,
        },
      });
      await expect(response).rejects.toHaveProperty(
        "message",
        expect.stringContaining("InvalidCommit")
      );

      // Alice removes her own like
      await alice.cells[0].callZome({
        zome_name: "likes",
        fn_name: "unlike",
        payload: targetAddress,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob tries to add a like for allice
      const response2 = bob.cells[0].callZome({
        zome_name: "likes",
        fn_name: "add_hash_for_liker",
        payload: {
          base_liker: alice.agentPubKey,
          target_hash: targetAddress,
        },
      });
      await expect(response2).rejects.toHaveProperty(
        "message",
        expect.stringContaining("InvalidCommit")
      );
    },
    true,
    { timeout: 500000 }
  );
});
