import { assert, test } from "vitest";
import { runScenario, pause } from "@holochain/tryorama";
import { Record } from "@holochain/client";
import { createMew } from "./common";
import {
  FeedMew,
  FollowInput,
  RecommendedInput,
  Mew,
  MewTypeName,
} from "../../../../ui/src/types/types";
import { mewsfeedAppBundleSource } from "../../common";

test("Weighted followed creators mews should be ordered by topic weights descending order", async () => {
  await runScenario(
    async (scenario) => {
      // Set up the app to be installed
      const appSource = { appBundleSource: mewsfeedAppBundleSource };

      // Add players with the test app to the Scenario. The returned players can be destructured.
      const [ann, bob, cat] = (
        await scenario.addPlayersWithApps([appSource, appSource, appSource])
      ).map((player) => {
        return {
          agentPubKey: player.agentPubKey,
          follow: (payload: FollowInput): Promise<null> =>
            player.cells[0].callZome({
              zome_name: "mews",
              fn_name: "follow",
              payload,
            }),
          createMew: (payload: Mew): Promise<Record> =>
            player.cells[0].callZome({
              zome_name: "mews",
              fn_name: "create_mew",
              payload,
            }),
          get_trusted_mews_with_context: (
            payload: RecommendedInput
          ): Promise<FeedMew[]> =>
            player.cells[0].callZome({
              zome_name: "mews",
              fn_name: "get_trusted_mews_with_context",
              payload,
            }),
        };
      });

      // Shortcut peer discovery through gossip and register all agents in every conductor of the scenario.
      await scenario.shareAllAgents();

      ann.follow({
        agent: bob.agentPubKey,
        followTopics: [
          {
            topic: "holochain",
            weight: "1.0",
          },
        ],
        followOther: false,
      });

      ann.follow({
        agent: cat.agentPubKey,
        followTopics: [
          {
            topic: "holochain",
            weight: "0.5",
          },
        ],
        followOther: false,
      });

      ann.follow({
        agent: bob.agentPubKey,
        followTopics: [
          {
            topic: "blockchain",
            weight: "0.25",
          },
        ],
        followOther: false,
      });

      ann.follow({
        agent: cat.agentPubKey,
        followTopics: [
          {
            topic: "blockchain",
            weight: "0",
          },
        ],
        followOther: false,
      });

      bob.createMew({
        text: "#holochain from bob, weight 1.0",
        links: [],
        mew_type: { [MewTypeName.Original]: null },
      });

      bob.createMew({
        mew_type: { [MewTypeName.Original]: null },
        text: "#blockchain from bob, weight 0.25",
        links: [],
      });

      cat.createMew({
        mew_type: { [MewTypeName.Original]: null },
        text: "#blockchain from cat, weight 0.0",
        links: [],
      });

      cat.createMew({
        mew_type: { [MewTypeName.Original]: null },
        text: "#holochain from cat, weight 0.5",
        links: [],
      });

      await scenario.shareAllAgents();

      let recommended_feed = await ann.get_trusted_mews_with_context({
        now: Date.now(),
        oldestMewSeconds: 60 * 60, // last hour
      });

      assert.equal(recommended_feed.length, 4);
      assert.equal(
        recommended_feed[0].mew.text,
        "#holochain from bob, weight 1.0"
      );
      assert.equal(
        recommended_feed[1].mew.text,
        "#holochain from cat, weight 0.5"
      );
      assert.equal(
        recommended_feed[2].mew.text,
        "#blockchain from bob, weight 0.25"
      );
      assert.equal(
        recommended_feed[3].mew.text,
        "#blockchain from cat, weight 0.0"
      );
    },
    true,
    { timeout: 100_000 }
  );
});
