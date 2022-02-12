<template>
  <q-card
    v-bind="$attrs"
    bordered
    class="text-body1"
  >
    <q-card-section class="row justify-between items-center">
      <div class="q-mr-lg">
        <label>Nickname:</label>
        {{ nickname }}
      </div>
      <div class="q-mr-lg">
        <label>Display name:</label>
        {{ displayName }}
      </div>
      <ButtonFollow
        :agent-pub-key="agentPubKey"
      />
    </q-card-section>
    <q-card-section>
      <div>
        <label>Bio:</label>
        {{ bio }}
      </div>
      <div>
        <label>Location:</label>
        {{ location }}
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { HoloHashB64 } from '@holochain-open-dev/core-types';
import { useProfileStore } from '../services/profile-store';
import { computed, onMounted, PropType, ref } from 'vue';
import { showError } from '../utils/notification';
import ButtonFollow from './ButtonFollow.vue';

const profileStore = useProfileStore();
const props = defineProps({
  agentPubKey: {
    type: Object as PropType<HoloHashB64>,
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
</script>