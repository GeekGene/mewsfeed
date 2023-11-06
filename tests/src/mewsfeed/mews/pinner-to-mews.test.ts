import { ActionHash } from "@holochain/client";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { assert, it } from "vitest";
import { FeedMew } from "../../../../ui/src/types/types.js";
import { createMew } from "./common.js";

it("link a Pinner to a Mew", async () => {
  await runScenario(
    async (scenario) => {
      console.time("1");
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
      console.log("app installed");
      console.timeEnd("1");

      // Shortcut peer discovery through gossip and register all agents in every
      // conductor of the scenario.
      console.time("2");
      await scenario.shareAllAgents();
      console.log("all agents shared");
      console.timeEnd("2");

      console.time("3");
      const baseAddress = alice.agentPubKey;
      const targetActionHash: ActionHash = await createMew(alice.cells[0]);
      console.timeEnd("3");
      console.log("created mew");

      console.time("4");
      // Bob gets the links, should be empty
      let linksOutput: FeedMew[] = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_pinner_with_context",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);
      console.log("get mews for pinner with context");
      console.timeEnd("4");

      // Alice creates a link from Pinner to Mew
      console.time("5");
      await alice.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "pin_hash",
        payload: targetActionHash,
      });
      console.timeEnd("5");
      console.log("get mews for pinner with context");

      console.time("6");
      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
      console.timeEnd("6");
      console.log("dht sync awaited");

      // Bob gets the links again
      console.time("7");
      linksOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_pinner_with_context",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 1);
      assert.deepEqual(targetActionHash, linksOutput[0].action_hash);
      console.timeEnd("7");
      console.log("bob got links again");

      console.time("8");
      await alice.cells[0].callZome({
        zome_name: "agent_pins",
        fn_name: "unpin_hash",
        payload: targetActionHash,
      });
      console.timeEnd("8");
      console.log("unpin hash");

      console.time("9");
      await dhtSync([alice, bob], alice.cells[0].cell_id[0]);
      console.timeEnd("9");
      console.log("dht awaited again");

      // Bob gets the links again
      console.time("10");
      linksOutput = await bob.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_mews_for_pinner_with_context",
        payload: baseAddress,
      });
      assert.equal(linksOutput.length, 0);
      console.timeEnd("10");
      console.log("get mews a final time");
    },
    true,
    { timeout: 500000 }
  );
});
