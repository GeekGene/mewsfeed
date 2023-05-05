<template>
  <RouterLink
    :to="{
      name: ROUTES.profiles,
      params: { agent: encodeHashToBase64(agentPubKey) },
    }"
    style="z-index: 200; width: 350px; position: absolute"
    @click.stop
  >
    <QCard v-bind="$attrs" class="text-body1 bg-white">
      <QCardSection
        class="row justify-between items-center"
        style="white-space: nowrap"
      >
        <div class="row">
          <agent-avatar
            :agentPubKey="agentPubKey"
            :store="profilesStore"
            size="50"
            :class="['q-mr-lg', { 'cursor-pointer': !isCurrentProfile }]"
          />
          <div
            :class="['q-mr-lg', { 'cursor-pointer': !isCurrentProfile }]"
            class="q-mt-sm"
          >
            <div
              class="text-primary text-weight-medium"
              style="white-space: break-word"
            >
              {{ displayName }}
            </div>
            <div>@{{ nickname }}</div>
          </div>
        </div>
        <ButtonFollow v-if="!isMyProfile" :agentPubKey="agentPubKey" />
      </QCardSection>
      <QCardSection v-if="bio || location" class="text-black">
        <div v-if="bio" class="row justify-start">
          <div>
            <label class="text-weight-bold q-mr-sm">Bio:</label>
          </div>
          <div>{{ bio }}</div>
        </div>
        <div v-if="location" class="row justify-start q-mt-md">
          <div>
            <label class="text-weight-bold q-mr-sm">Location:</label>
          </div>
          <div>{{ location }}</div>
        </div>
      </QCardSection>
      <div
        class="row justify-end items-start q-mx-sm"
        style="white-space: nowrap"
      >
        <holo-identicon :hash="agentPubKey" size="30"></holo-identicon>
      </div>
    </QCard>
  </RouterLink>
</template>

<script setup lang="ts">
import { useProfilesStore } from "@/stores/profiles";
import { PROFILE_FIELDS } from "@/types/types";
import { isSameHash } from "@/utils/hash";
import { showError } from "@/utils/notification";
import { ROUTES } from "@/router";
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
