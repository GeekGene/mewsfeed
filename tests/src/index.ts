import { Orchestrator } from "@holochain/tryorama";
import mews from "./clutter/mews";

const orchestrator = new Orchestrator();
mews(orchestrator);
orchestrator.run();
