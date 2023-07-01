import { assert, test } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { createAgents } from "../../common";

test("trusted_feed_is_based_on_follow_topics", async () => {
  await runScenario(
    async (scenario) => {
      // Add players with the test app to the Scenario. The returned players can be destructured.
      const [ann, bob, cat] = await createAgents(scenario);

      await ann.follow({
        agent: bob.pubkey,
        follow_topics: [
          {
            topic: "holochain",
            weight: "1.0",
          },
        ],
      });

      await ann.follow({
        agent: cat.pubkey,
        follow_topics: [
          {
            topic: "blockchain",
            weight: "1.0",
          },
        ],
      });

      await bob.createMew({
        text: "Wow #holochain is cool!",
        links: null,
      });

      await cat.createMew({
        text: "Doh #holochain when moon?",
        links: null,
      });

      // TODO something like this -- maybe in common.ts?
      // await awaitDhtIntegration([ann, bob], alice.cells[0].cell_id[0]);

      let trustFeed = await ann.trustFeed({
        now: Date.now(),
        oldest_mew_seconds: 60 * 60, // last hour
      });

      assert.equal(trustFeed.len(), 1);
      assert.equal(
        trustFeed[0].feed_mew.mew.content.as_ref().unwrap().text,
        "Wow #holochain is cool!"
      );
    },
    true,
    { timeout: 100_000 }
  );
});

test("trusted_feed_is_filtered_by_recency", async () => {
  await runScenario(
    async (scenario) => {
      // Add players with the test app to the Scenario. The returned players can be destructured.
      const [ann, bob] = await createAgents(scenario);

      await ann.follow({
        agent: bob.pubkey,
        follow_topics: [
          {
            topic: "holochain",
            weight: "0.9",
          },
        ],
      });

      await bob.createMew({
        text: "OLD #holochain mew",
        links: null,
      });

      let oldest_mew_seconds = 2;

      await bob.createMew({
        text: "NEW #holochain mew",
        links: null,
      });

      // TODO something like this -- maybe in common.ts?
      // await awaitDhtIntegration([ann, bob], alice.cells[0].cell_id[0]);

      let trustFeed = await ann.trustFeed({
        now: Date.now(),
        oldest_mew_seconds,
      });

      assert.equal(trustFeed.len(), 1);
      assert.equal(
        trustFeed[0].feed_mew.mew.content.as_ref().unwrap().text,
        "NEW #holochain mew"
      );
    },
    true,
    { timeout: 100_000 }
  );
});

test("Weighted followed creators mews should be ordered by topic weights descending order", async () => {
  await runScenario(
    async (scenario) => {
      // Add players with the test app to the Scenario. The returned players can be destructured.
      const [ann, bob, cat] = await createAgents(scenario);

      // Shortcut peer discovery through gossip and register all agents in every conductor of the scenario.
      await scenario.shareAllAgents();

      await ann.follow({
        agent: bob.agentPubKey,
        followTopics: [
          {
            topic: "holochain",
            weight: "1.0",
          },
        ],
      });

      await ann.follow({
        agent: cat.agentPubKey,
        followTopics: [
          {
            topic: "holochain",
            weight: "0.5",
          },
        ],
      });

      await ann.follow({
        agent: bob.agentPubKey,
        followTopics: [
          {
            topic: "blockchain",
            weight: "0.25",
          },
        ],
      });

      await ann.follow({
        agent: cat.agentPubKey,
        followTopics: [
          {
            topic: "blockchain",
            weight: "0",
          },
        ],
      });

      await bob.createMew({
        text: "#holochain from bob, weight 1.0",
        links: [],
      });

      await bob.createMew({
        text: "#blockchain from bob, weight 0.25",
        links: [],
      });

      await cat.createMew({
        text: "#blockchain from cat, weight 0.0",
        links: [],
      });

      await cat.createMew({
        text: "#holochain from cat, weight 0.5",
        links: [],
      });

      await pause(2_000);

      let trustFeed = await ann.trustFeed({
        now: Date.now(),
        oldestMewSeconds: 60 * 60, // last hour
      });

      console.log(trustFeed.map((feedmew) => feedmew.mew.text));

      assert.equal(trustFeed.length, 4);
      assert.equal(trustFeed[0].mew.text, "#holochain from bob, weight 1.0");
      assert.equal(trustFeed[1].mew.text, "#holochain from cat, weight 0.5");
      assert.equal(trustFeed[2].mew.text, "#blockchain from bob, weight 0.25");
      assert.equal(trustFeed[3].mew.text, "#blockchain from cat, weight 0.0");
    },
    true,
    { timeout: 100_000 }
  );
});
