import { assert, describe, it } from "vitest";

import { AgentPubKey, HoloHash, fakeActionHash } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";

// describe.concurrent("pinner-to-hashes", () => {
it("link a Pinner to a Hash", async () => {
  await runScenario(
    async (scenario) => {
      // Construct proper paths for your app.
      // This assumes app bundle created by the `hc app pack` command.
      const testAppPath = process.cwd() + "/../workdir/mewsfeed.happ";

      // Set up the app to be installed
      const appSource = { appBundleSource: { path: testAppPath } };

      // Add 2 players with the test app to the Scenario. The returned players
      // can be destructured.
      const [alice, bob] = await scenario.addPlayersWithApps([
        appSource,
        appSource,
      ]);

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      await scenario.shareAllAgents();

      const baseAddress = alice.agentPubKey;
      const targetHash = await fakeActionHash();

      // Bob gets the links, should be empty
      let linksOutput: HoloHash[] = await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "get_hashes_for_pinner",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Alice creates a link from Pinner to Hash
      await alice.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "pin_hash",
        payload: targetHash,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "get_hashes_for_pinner",
        payload: baseAddress,
      });

      assert.equal(linksOutput.length, 1);

      // Bob gets the links in the inverse direction
      const pinnersOutput: AgentPubKey[] = await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "get_pinners_for_hash",
        payload: targetHash,
      });
      assert.equal(pinnersOutput.length, 1);

      await alice.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "unpin_hash",
        payload: targetHash,
      });

      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

      // Bob gets the links again
      linksOutput = await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "get_hashes_for_pinner",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);

      // Bob gets the links in the inverse direction
      linksOutput = await bob.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "get_pinners_for_hash",
        payload: targetHash,
      });

      assert.equal(linksOutput.length, 0);
    },
    true,
    { timeout: 500000 }
  );
});
// });
