<template>
  <q-card v-bind="$attrs" class="text-body1">
    <q-card-section class="row justify-between items-center">
      <agent-avatar
        :agentPubKey="agentPubKey"
        :store="profileStore"
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
import { useProfileStore } from "@/services/profile-store";
import { isSameAgentPubKey } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { useProfileUtils } from "@/utils/profile";
import { Profile } from "@holochain-open-dev/profiles";
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

const router = useRouter();
const profileStore = useProfileStore();
const { onAgentClick } = useProfileUtils();
const isMyProfile = computed(() => isSameAgentPubKey(props.agentPubKey, profileStore.myAgentPubKey));
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
    let profile: Profile | undefined;
    const profileReadable = await profileStore.fetchAgentProfile(
      props.agentPubKey
    );
    profileReadable.subscribe((p) => (profile = p));
    if (profile) {
      nickname.value = profile.nickname;
      displayName.value = profile.fields["Display name"];
      bio.value = profile.fields.Bio;
      location.value = profile.fields.Location;
    }
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
});
</script>
