import { Config, InstallAgentsHapps } from '@holochain/tryorama';
import path from 'path'
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const clutterDna = path.join(__dirname, "../../dnas/clutter/workdir/clutter.dna");
export const clutterIndexDna = path.join(__dirname, "../../dnas/clutter_index/workdir/clutter_index.dna");


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
