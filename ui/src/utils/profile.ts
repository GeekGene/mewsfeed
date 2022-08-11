import { ROUTES } from "@/router";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentPubKey } from "@holochain/client";
import { useRoute, useRouter } from "vue-router";

export const useProfileUtils = () => {
  const route = useRoute();
  const router = useRouter();

  const isCurrentProfile = (agentPubKey: AgentPubKey) =>
    route.params.agent === serializeHash(agentPubKey);

  const onAgentClick = (agentPubKey: AgentPubKey) => {
    if (!isCurrentProfile(agentPubKey)) {
      router.push({
        name: ROUTES.profiles,
        params: { agent: serializeHash(agentPubKey) },
      });
    }
  };

  return { isCurrentProfile, onAgentClick };
};
