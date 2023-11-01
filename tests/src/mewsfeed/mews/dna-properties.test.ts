import { ActionHash } from "@holochain/client";
import { runScenario } from "@holochain/tryorama";
import { assert, describe, expect, it } from "vitest";
import { Mew, MewTypeName } from "../../../../ui/src/types/types.js";
import {
  mewsfeedAppBundleSource,
  mewsfeedAppBundleSourceNoLengthLimits,
} from "../../common.js";

// describe.concurrent("dna-properties", () => {
it("Mew must not be longer than DNA property mew_characters_max chars", async () => {
  await runScenario(async (scenario) => {
    // Set up the app to be installed
    const appSource = { appBundleSource: mewsfeedAppBundleSource };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice] = await scenario.addPlayersWithApps([appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const createMewInput: Mew = {
      text: new Array(200).fill("a").join(""),
      links: [],
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
      "alice created a mew of valid length"
    );

    createMewInput.text = new Array(201).fill("a").join("");
    try {
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput,
      });
      assert.fail("mew content longer than mew_characters_max is valid");
    } catch (error) {
      assert.ok(true, "mew content longer than mew_characters_max is invalid");
    }
  }, true);
});

it("Mew must not be shorter than DNA property mew_characters_min chars", async () => {
  await runScenario(async (scenario) => {
    // Set up the app to be installed
    const appSource = { appBundleSource: mewsfeedAppBundleSource };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice] = await scenario.addPlayersWithApps([appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    const createMewInput: Mew = {
      text: new Array(10).fill("a").join(""),
      links: [],
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
      "alice created a mew of valid length"
    );

    createMewInput.text = new Array(2).fill("a").join("");
    try {
      await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "create_mew",
        payload: createMewInput,
      });
      assert.fail("mew content shorter than mew_characters_min is valid");
    } catch (error) {
      assert.ok(true, "mew content shorter than mew_characters_min is invalid");
    }
  }, true);
});

it("Mew can be any length if DNA property mew_characters_min and mew_characters_max not set", async () => {
  await runScenario(async (scenario) => {
    // Set up the app to be installed
    const appSource = {
      appBundleSource: mewsfeedAppBundleSourceNoLengthLimits,
    };

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice] = await scenario.addPlayersWithApps([appSource]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();

    // 0 charactres
    const createMewInput2: Mew = {
      text: "",
      links: [],
      mew_type: { [MewTypeName.Original]: null },
    };
    const action_hash2: ActionHash = await alice.cells[0].callZome({
      zome_name: "mews",
      fn_name: "create_mew",
      payload: createMewInput2,
    });
    assert.deepEqual(
      action_hash2.slice(0, 3),
      Buffer.from([132, 41, 36]),
      "alice created a mew of valid length 0"
    );

    // 1000 charactres
    const createMewInput3: Mew = {
      text: new Array(1000).fill("a").join(""),
      links: [],
      mew_type: { [MewTypeName.Original]: null },
    };
    const action_hash3: ActionHash = await alice.cells[0].callZome({
      zome_name: "mews",
      fn_name: "create_mew",
      payload: createMewInput3,
    });
    assert.deepEqual(
      action_hash3.slice(0, 3),
      Buffer.from([132, 41, 36]),
      "alice created a mew of valid length 1000"
    );
  }, true);
});

it("Can get deserialized DNA Properties", async () => {
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

      const properties = await alice.cells[0].callZome({
        zome_name: "mews",
        fn_name: "get_dna_properties",
        payload: null,
      });
      expect(properties).toHaveProperty("mew_characters_min", 5);
      expect(properties).toHaveProperty("mew_characters_max", 200);
    },
    true,
    { timeout: 500000 }
  );
});
// });
