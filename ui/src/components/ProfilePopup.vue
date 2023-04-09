<template>
  <q-card v-bind="$attrs" class="text-body1">
    <q-card-section
      class="row justify-between items-center"
      style="white-space: nowrap"
    >
      <agent-avatar
        :agentPubKey="agentPubKey"
        :store="profilesStore"
        size="50"
        :class="['q-mr-lg', { 'cursor-pointer': !isCurrentProfile }]"
        @click.capture.prevent="onAgentClick(agentPubKey)"
      />
      <div
        :class="['q-mr-lg', { 'cursor-pointer': !isCurrentProfile }]"
        class="q-mt-sm"
        @click.capture.prevent="onAgentClick(agentPubKey)"
      >
        <div
          class="text-primary text-weight-medium"
          style="white-space: break-word"
        >
          {{ displayName }}
        </div>
        <div>@{{ nickname }}</div>
      </div>
      <ButtonFollow v-if="!isMyProfile" :agentPubKey="agentPubKey" />
    </q-card-section>
    <q-card-section v-if="bio || location">
      <div v-if="bio" class="row justify-start">
        <div><label class="text-weight-bold q-mr-sm">Bio:</label></div>
        <div>{{ bio }}</div>
      </div>
      <div v-if="location" class="row justify-start q-mt-md">
        <div><label class="text-weight-bold q-mr-sm">Location:</label></div>
        <div>{{ location }}</div>
      </div>
    </q-card-section>
    <div class="flex justify-end q-mx-sm">
      <holo-identicon :hash="agentPubKey" size="30"></holo-identicon>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { useProfilesStore } from "@/services/profiles-store";
import { PROFILE_FIELDS } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { useProfileUtils } from "@/utils/profile";

import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { computed, onMounted, PropType, ref } from "vue";
import { useRouter } from "vue-router";
import ButtonFollow from "./ButtonFollow.vue";

const props = defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});

const router = useRouter();
const profilesStore = useProfilesStore();
const { onAgentClick } = useProfileUtils();
const isMyProfile = computed(() =>
  isSameHash(props.agentPubKey, profilesStore.value.client.client.myPubKey)
);
const isCurrentProfile = computed(
  () =>
    router.currentRoute.value.params.agent ===
    encodeHashToBase64(props.agentPubKey)
);

const nickname = ref("");
const displayName = ref("");
const bio = ref("");
const location = ref("");
const loading = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    const profile = await profilesStore.value.client.getAgentProfile(
      props.agentPubKey
    );
    if (profile) {
      nickname.value = profile.nickname;
      displayName.value = profile.fields[PROFILE_FIELDS.DISPLAY_NAME];
      bio.value = profile.fields[PROFILE_FIELDS.BIO];
      location.value = profile.fields[PROFILE_FIELDS.LOCATION];
    }
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
});
</script>
