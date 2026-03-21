<template>
  <BaseLinkProfilePopup
    v-if="profile"
    :agent-pub-key="agentPubKey"
    :enabled="enablePopup"
  >
    <div class="flex justify-end items-center space-x-2">
      <agent-avatar
        :agentPubKey="agentPubKey"
        :size="avatarSize"
        disable-tooltip
        disable-copy
      />
      <BaseAgentProfileName :agentPubKey="agentPubKey" />
    </div>
  </BaseLinkProfilePopup>
  <BaseAgentProfileNameSkeleton v-else />
</template>

<script setup lang="ts">
import { ProfilesStore } from "@holochain-open-dev/profiles";
import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { ComputedRef, computed, inject } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useCellsReady } from "@/composables/useCellsReady";
import BaseLinkProfilePopup from "@/components/BaseLinkProfilePopup.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";
import BaseAgentProfileNameSkeleton from "@/components/BaseAgentProfileNameSkeleton.vue";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    avatarSize?: number;
    enablePopup?: boolean;
  }>(),
  {
    avatarSize: 20,
    enablePopup: true,
  }
);

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const cellsReady = useCellsReady();
const agentPubKeyB64 = computed(() => encodeHashToBase64(props.agentPubKey));

const fetchProfile = async () => {
  const record = await profilesStore.client.getAgentProfile(
    props.agentPubKey,
    false
  );
  return record?.entry ?? null;
};

const { data: profile } = useQuery({
  queryKey: ["profiles", "getAgentProfile", agentPubKeyB64],
  queryFn: fetchProfile,
  enabled: cellsReady,
});
</script>

<style scoped></style>
