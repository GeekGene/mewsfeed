import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const clutterDna = {
  path: path.join(__dirname, "../../dnas/clutter/workdir/clutter.dna"),
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms));
