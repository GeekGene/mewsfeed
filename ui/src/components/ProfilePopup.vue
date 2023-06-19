<template>
  <RouterLink
    v-if="profile"
    :to="{
      name: ROUTES.profile,
      params: { agentPubKey: encodeHashToBase64(agentPubKey) },
    }"
    class="w-32 z-50 absolute rounded-3xl bg-base-100 shadow-lg p-4"
    @click.stop
  >
    <div v-bind="$attrs">
      <div class="flex justify-between items-center whitespace-nowrap">
        <div class="row">
          <BaseAgentProfileName :profile="profile" :agentPubKey="agentPubKey" />
        </div>
        <ButtonFollow v-if="!isMyProfile" :agentPubKey="agentPubKey" />
      </div>
      <div class="flex flex-col space-y-4">
        <div
          v-if="profile.fields[PROFILE_FIELDS.BIO]"
          class="flex justify-start space-x-2"
        >
          <label class="font-bold">Bio:</label>
          <div>{{ profile.fields[PROFILE_FIELDS.BIO] }}</div>
        </div>
        <div
          v-if="profile.fields[PROFILE_FIELDS.LOCATION]"
          class="flex justify-start space-x-2"
        >
          <label class="font-bold">Location:</label>
          <div>{{ profile.fields[PROFILE_FIELDS.LOCATION] }}</div>
        </div>
      </div>
      <div class="flex justify-end items-start mx-2 whitespace-nowrap">
        <holo-identicon :hash="agentPubKey" size="30"></holo-identicon>
      </div>
    </div>
  </RouterLink>
</template>

<script setup lang="ts">
import isEqual from "lodash/isEqual";
import { showError } from "@/utils/toasts";
import { ROUTES } from "@/router";
import {
  AgentPubKey,
  AppAgentClient,
  encodeHashToBase64,
} from "@holochain/client";
import { computed, ComputedRef, inject, onMounted, PropType, ref } from "vue";
import ButtonFollow from "@/components/ButtonFollow.vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";
import { PROFILE_FIELDS } from "@/types/types";

const props = defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const client = (inject("client") as ComputedRef<AppAgentClient>).value;

const isMyProfile = computed(() => isEqual(props.agentPubKey, client.myPubKey));

const profile = ref();
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
