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
      <q-icon
        v-if="agentPubKey !== store.myAgentPubKey"
        :name="following ? 'star' : 'star_outline'"
        size="md"
        color="accent"
        class="cursor-pointer"
        @click="toggleFollow"
      />
    </q-card-section>
    <q-card-section>
      <div><label>Bio: </label>{{ bio }}</div>
      <div><label>Location: </label>{{ location }}</div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { HoloHashB64 } from '@holochain-open-dev/core-types';
import { useProfileStore } from '../services/profile-store';
import { showError, showMessage } from '../utils/notification';
import { onMounted, PropType, ref } from 'vue';
import { follow, myFollowing, unfollow } from '../services/clutter-dna';

const props = defineProps({
    agentPubKey: {
        type: Object as PropType<HoloHashB64>,
        required: true
    }
});

const loading = ref(false);
const nickname = ref("");
const bio = ref("");
const location = ref("");
const following = ref(false);

const store = useProfileStore();

onMounted(async () => {
    try {
        loading.value = true;
        const profile = await store.fetchAgentProfile(props.agentPubKey);
        if (profile) {
            nickname.value = profile.nickname;
            bio.value = profile.fields.Bio;
            location.value = profile.fields.Location;
        }
        const currentMyFollowing = await myFollowing();
        following.value = currentMyFollowing.includes(props.agentPubKey);
    } catch (error) {
        showError(error);
    } finally {
        loading.value = false;
    }
});

const toggleFollow = async () => {
    try {
        if (following.value) {
            await unfollow(props.agentPubKey);
        } else {
            await follow(props.agentPubKey);
        }
        following.value = !following.value;
        const message = (following.value ? `You're following ` : 'You stopped following ') + nickname.value;
        showMessage(message);
    } catch (error) {
        showError(error);
    }
};
</script>