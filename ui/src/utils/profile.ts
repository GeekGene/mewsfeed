import { ROUTES } from "@/router";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { useRoute, useRouter } from "vue-router";

export const useProfileUtils = () => {
  const route = useRoute();
  const router = useRouter();

  const isCurrentProfile = (agentPubKey: AgentPubKey) =>
    route.params.agent === encodeHashToBase64(agentPubKey);

  const onAgentClick = (agentPubKey: AgentPubKey) => {
    if (!isCurrentProfile(agentPubKey)) {
      router.push({
        name: ROUTES.profiles,
        params: { agent: encodeHashToBase64(agentPubKey) },
      });
    }
  };

  return { isCurrentProfile, onAgentClick };
};
