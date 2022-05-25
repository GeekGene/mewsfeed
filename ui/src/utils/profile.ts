import { ROUTES } from "@/router";
import { HoloHashB64 } from "@holochain/client";
import { useRoute, useRouter } from "vue-router";

export const useProfileUtils = () => {
  const route = useRoute();
  const router = useRouter();

  const isCurrentProfile = (agentPubKey: HoloHashB64) =>
    route.params.agent === agentPubKey;

  const onAgentClick = (agentPubKey: HoloHashB64) => {
    if (!isCurrentProfile(agentPubKey)) {
      router.push({ name: ROUTES.profiles, params: { agent: agentPubKey } });
    }
  };

  return { isCurrentProfile, onAgentClick };
};
