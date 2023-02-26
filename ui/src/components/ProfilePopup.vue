<template>
  <q-card v-bind="$attrs" class="text-body1">
    <q-card-section class="row justify-between items-center">
      <agent-avatar
        :agentPubKey="agentPubKey"
        :_store="profilesStore"
        size="50"
        :class="['q-mr-lg', { 'cursor-pointer': !isCurrentProfile }]"
        @click="onAgentClick(agentPubKey)"
      />
      <div
        :class="['q-mr-lg', { 'cursor-pointer': !isCurrentProfile }]"
        @click="onAgentClick(agentPubKey)"
      >
        <div class="text-primary text-weight-medium">
          {{ displayName }}
        </div>
        <div>@{{ nickname }}</div>
      </div>
      <ButtonFollow v-if="!isMyProfile" :agent-pub-key="agentPubKey" />
    </q-card-section>
    <q-card-section class="row">
      <div class="q-mr-md">
        <div><label class="text-weight-medium">Bio:</label></div>
        <div><label class="text-weight-medium">Location:</label></div>
      </div>
      <div class="col-grow">
        <div>{{ bio }}</div>
        <div>{{ location }}</div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { useProfilesStore } from "@/services/profiles-store";
import { PROFILE_FIELDS } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { useProfileUtils } from "@/utils/profile";
import { serializeHash } from "@holochain-open-dev/utils";
import { AgentPubKey } from "@holochain/client";
import { computed, onMounted, PropType, ref } from "vue";
import { useRouter } from "vue-router";
import ButtonFollow from "./ButtonFollow.vue";

const props = defineProps({
  agentPubKey: {
    type: Object as PropType<AgentPubKey>,
    required: true,
  },
});
console.log("profilepopup", props.agentPubKey);

const router = useRouter();
const profilesStore = useProfilesStore();
const { onAgentClick } = useProfileUtils();
const isMyProfile = computed(() =>
  isSameHash(props.agentPubKey, profilesStore.value.client.client.myPubKey)
);
const isCurrentProfile = computed(
  () =>
    router.currentRoute.value.params.agent === serializeHash(props.agentPubKey)
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
