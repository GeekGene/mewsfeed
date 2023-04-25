import { AgentPubKey } from "@holochain/client";
import { pause, runScenario } from "@holochain/tryorama";
import { assert, test } from "vitest";

import { mewsfeedHapp } from "../utils.js";

test("Following oneself should fail", async () => {
  await runScenario(
    async (scenario) => {
      const alice = await scenario.addPlayerWithApp(mewsfeedHapp);

      try {
        await alice.cells[0].callZome(
          { zome_name: "follows", fn_name: "follow" },
          60000
        );
        assert.fail();
      } catch (e) {
        const myFollowers: AgentPubKey[] = await alice.cells[0].callZome(
          {
            zome_name: "follows",
            fn_name: "get_followees_for_follower",
            payload: alice.agentPubKey,
          },
          60000
        );
        assert.equal(myFollowers.length, 0, "no followers");
        assert.ok(true, "following self failed");
      }
    },
    true,
    { timeout: 60000 }
  );
});

test("Following", async () => {
  await runScenario(
    async (scenario) => {
      const [alice, bob] = await scenario.addPlayersWithApps([
        { appBundleSource: mewsfeedHapp },
        { appBundleSource: mewsfeedHapp },
      ]);

      await scenario.shareAllAgents();

      const aliceFollowersInitial: AgentPubKey[] =
        await alice.cells[0].callZome({
          zome_name: "follows",
          fn_name: "get_followers_for_followee",
          payload: alice.agentPubKey,
        });
      assert.ok(aliceFollowersInitial.length === 0, "alice has no followers");

      const aliceMyFollowingInitial: AgentPubKey[] =
        await alice.cells[0].callZome({
          zome_name: "follows",
          fn_name: "get_followees_for_follower",
          payload: alice.agentPubKey,
        });
      assert.ok(
        aliceMyFollowingInitial.length === 0,
        "alice is not following anyone"
      );

      // bob starts following alice
      await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "follow",
        payload: alice.agentPubKey,
      });
      await pause(5000);

      const aliceFollowers: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_followee",
        payload: alice.agentPubKey,
      });
      assert.deepEqual(aliceFollowers, [bob.agentPubKey], "bob follows alice");

      const followersOfAlice: AgentPubKey[] = await alice.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_followee",
        payload: alice.agentPubKey,
      });
      assert.deepEqual(
        followersOfAlice,
        [bob.agentPubKey],
        "bob is a follower of alice"
      );

      const bobMyFollowing = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followees_for_follower",
        payload: bob.agentPubKey,
      });
      assert.deepEqual(
        bobMyFollowing,
        [alice.agentPubKey],
        "bob is following alice"
      );

      const bobMyFollowers: AgentPubKey[] = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followers_for_followee",
        payload: bob.agentPubKey,
      });
      assert.ok(bobMyFollowers.length === 0, "bob has no followers");

      const agentsFollowingAlice: AgentPubKey[] = await bob.cells[0].callZome({
        zome_name: "follows",
        fn_name: "get_followees_for_follower",
        payload: bob.agentPubKey,
      });
      assert.deepEqual(
        agentsFollowingAlice,
        [alice.agentPubKey],
        "bob is a follower of alice"
      );
    },
    true,
    { timeout: 60000 }
  );
});
