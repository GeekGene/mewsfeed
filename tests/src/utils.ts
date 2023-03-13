import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const clutterHapp = {
  path: path.join(__dirname, "../../workdir/clutter.happ"),
};

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(() => resolve(null), ms));
