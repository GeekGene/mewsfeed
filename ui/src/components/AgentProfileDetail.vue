<template>
  <BaseAgentProfileDetail
    v-if="profile"
    :profile="profile"
    :agentPubKey="agentPubKey"
    :creators-count="creatorsCount"
    :followers-count="followersCount"
    :hide-edit-button="hideEditButton"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">
import { showError } from "@/utils/toasts";
import { AgentPubKey } from "@holochain/client";
import { ComputedRef, inject, onMounted, ref } from "vue";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import BaseAgentProfileDetail from "@/components/BaseAgentProfileDetail.vue";

const props = withDefaults(
  defineProps<{
    agentPubKey: AgentPubKey;
    creatorsCount?: number;
    followersCount?: number;
    hideEditButton?: boolean;
  }>(),
  {
    hideEditButton: false,
    creatorsCount: undefined,
    followersCount: undefined,
  }
);

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;

const profile = ref<Profile>();
const loading = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    const res = await profilesStore.client.getAgentProfile(props.agentPubKey);
    if (res) {
      profile.value = res;
    }
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
});
</script>
