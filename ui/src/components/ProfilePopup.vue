<template>
  <q-card
    v-bind="$attrs"
    class="text-body1"
  >
    <q-card-section class="row justify-between items-center">
      <context-provider
        :context="profilesStoreContext"
        :value="profileStore"
      >
        <agent-avatar
          :agent-pub-key="agentPubKey"
          size="50"
          class="q-mr-lg cursor-pointer"
          @click="onAgentClick(agentPubKey)"
        />
      </context-provider>
      <div class="q-mr-lg text-primary">
        <div class="text-weight-medium">
          {{ displayName }}
        </div>
        <div>@{{ nickname }}</div>
      </div>
      <ButtonFollow
        v-if="!isMyProfile"
        :agent-pub-key="agentPubKey"
      />
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
import { HoloHashB64 } from '@holochain-open-dev/core-types';
import { profilesStoreContext } from '@holochain-open-dev/profiles';
import { useProfileStore } from '@/services/profile-store';
import { computed, onMounted, PropType, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showError } from '@/utils/notification';
import ButtonFollow from './ButtonFollow.vue';

const router = useRouter();
const profileStore = useProfileStore();
const props = defineProps({
  agentPubKey: {
    type: String as PropType<HoloHashB64>,
    required: true
  }
});
const isMyProfile = computed(() => props.agentPubKey === profileStore.myAgentPubKey);

const nickname = ref("");
const displayName = ref("");
const bio = ref("");
const location = ref("");
const loading = ref(false);

onMounted(async () => {
  try {
    loading.value = true;
    const profile = await profileStore.fetchAgentProfile(props.agentPubKey);
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

const onAgentClick = (agentPubKey: HoloHashB64) => {
  router.push(`/profiles/${agentPubKey}`);
};
</script>