import { HoloHashB64 } from "@holochain/client";
import { Router } from "vue-router";


export const isCurrentProfile = (router: Router, agentPubKey: HoloHashB64) => {
  return router.currentRoute.value.params.agent === agentPubKey;
};

export const onAgentClick = (router: Router, agentPubKey: HoloHashB64) => {
    if (!isCurrentProfile(router, agentPubKey)) {
      router.push(`/profiles/${agentPubKey}`);
    }
  };