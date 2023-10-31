import { TryCpScenario } from "@holochain/tryorama";
import { Mew } from "../../ui/src/types/types";
import { test } from "vitest";
import { ActionHash, encodeHashToBase64, AppBundle } from "@holochain/client";

const ZOME_NAME = "mews";

const TRYCP_SERVER_PORT = 9000;

// 172.26.211.71
// 172.26.206.61
// 172.26.212.148

const holoportIps = ["172.26.211.71"];
// const holoportIps = ["172.26.212.148", "172.26.211.71"];
// const holoportIps = ["172.26.212.148", "172.26.206.61", "172.26.211.71"];
const holoportUrls = holoportIps.map(
  (ip) => new URL(`ws://${ip}:${TRYCP_SERVER_PORT}`)
);

const app: { bundle: AppBundle } = {
  bundle: {
    manifest: {
      manifest_version: "1",
      name: "holofuel",
      roles: [
        {
          dna: {
            url: "https://github.com/jost-s/hc-utils/releases/download/0.2.1-beta-rc.0/holofuel.dna",
            modifiers: {
              network_seed: Date.now().toString(),
            },
          },
          name: "role",
        },
      ],
    },
    resources: {},
  },
};

console.log(`Distributed test across ${holoportIps.length} HoloPorts`);
console.log();

test("stress test local", async (t) => {
  const scenario = new TryCpScenario();
  const numberOfAgentsPerConductor = 10;

  try {
    const clientsPlayers = await scenario.addClientsPlayers(holoportUrls, {
      app,
      numberOfAgentsPerConductor,
    });

    const mew: Mew = {
      text: "01234567890",
      links: [],
      mew_type: { Original: null },
    };
    await Promise.all(
      clientsPlayers[0].players.map((player, index) => {
        return player.cells[0]
          .callZome({
            zome_name: ZOME_NAME,
            fn_name: "create_mew",
            payload: mew,
          })
          .then((actionHash: ActionHash) => {
            console.log(index, "response", encodeHashToBase64(actionHash));
            t.expect(actionHash).not.toBeNull();
          });
      })
    );
  } catch (error) {
    console.log("ererere", error);
  }
});
