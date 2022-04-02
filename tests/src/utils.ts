import { Config, InstallAgentsHapps } from '@holochain/tryorama';
import { serializeHash } from "@holochain-open-dev/core-types";
import path from 'path'
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const clutterDna = path.join(__dirname, "../../dnas/clutter/workdir/clutter.dna");

export const config = Config.gen();

export const installation: InstallAgentsHapps = [
  // one agent
  [
    [
      clutterDna
    ]
  ]
];

export const sleep = (ms: number) => new Promise(resolve => setTimeout(() => resolve(null), ms));


export const authorPubKey = (author: unknown) => {
    if (author instanceof Uint8Array) {
        return serializeHash(author);
    }
    throw new Error("AgentPubKey is not Uint8Array");
};

export const entryHash = (hash: unknown) => {
    if (hash instanceof Uint8Array) {
        return serializeHash(hash);
    }
    throw new Error("EntryHash is not Uint8Array");
};