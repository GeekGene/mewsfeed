import { assert, test } from "vitest";

import { runScenario, pause } from "@holochain/tryorama";
import { Record } from "@holochain/client";

test("link a Pinner to a Hash", async () => {
  await runScenario(async (scenario) => {
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
    const targetAddress = alice.agentPubKey;

    // Bob gets the links, should be empty
    let linksOutput: Record[] = await bob.cells[0].callZome({
      zome_name: "agent_pins",
      fn_name: "get_hashes_for_pinner",
      payload: baseAddress,
    });
    assert.equal(linksOutput.length, 0);

    // Alice creates a link from Pinner to Hash
    await alice.cells[0].callZome({
      zome_name: "agent_pins",
      fn_name: "add_hash_for_pinner",
      payload: {
        base_pinner: baseAddress,
        target_hash: targetAddress,
      },
    });

    await pause(1200);

    // Bob gets the links again
    linksOutput = await bob.cells[0].callZome({
      zome_name: "agent_pins",
      fn_name: "get_hashes_for_pinner",
      payload: baseAddress,
    });
    assert.equal(linksOutput.length, 1);

    // Bob gets the links in the inverse direction
    linksOutput = await bob.cells[0].callZome({
      zome_name: "agent_pins",
      fn_name: "get_pinners_for_hash",
      payload: targetAddress,
    });
    assert.equal(linksOutput.length, 1);

    await alice.cells[0].callZome({
      zome_name: "agent_pins",
      fn_name: "remove_hash_for_pinner",
      payload: {
        base_pinner: baseAddress,
        target_hash: targetAddress,
      },
    });

    await pause(1200);

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
      payload: targetAddress,
    });
    assert.equal(linksOutput.length, 0);
  });
});
