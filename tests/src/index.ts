
import { Orchestrator } from "@holochain/tryorama";

import mews from './clutter/mews';
import index_stub from './clutter/index_stub';
import filestore from './clutter/filestore';
import pathlinks from './clutter/pathlinks';
import index from './clutter_index/index';
import services from './clutter_index/services';

let orchestrator: Orchestrator<any>;

orchestrator = new Orchestrator();
mews(orchestrator);
orchestrator.run();

orchestrator = new Orchestrator();
index_stub(orchestrator);
orchestrator.run();

orchestrator = new Orchestrator();
filestore(orchestrator);
orchestrator.run();

orchestrator = new Orchestrator();
pathlinks(orchestrator);
orchestrator.run();

orchestrator = new Orchestrator();
index(orchestrator);
orchestrator.run();

orchestrator = new Orchestrator();
services(orchestrator);
orchestrator.run();



