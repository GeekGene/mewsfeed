<template>
  <q-card
    v-bind="$attrs"
    bordered
  >
    <q-card-section>{{ nickname }}</q-card-section>
    <q-icon
      :name="following ? 'star' : 'star_outline'"
      size="md"
      color="accent"
      class="cursor-pointer"
    /> 
  </q-card>
</template>

<script setup lang="ts">
import { HoloHashB64 } from '@holochain-open-dev/core-types';
import { useProfileStore } from '../services/profile-store';
import { authorPubKey } from '../utils/hash';
import { showError } from '../utils/notification';
import { onMounted, PropType, ref } from 'vue';
import { myFollowing } from '../services/clutter-dna';

const props = defineProps({
    author: {
        type: Object as PropType<HoloHashB64>,
        required: true
    }
});

const loading = ref(false);
const nickname = ref("");
const following = ref(false);

const agentPubKey = authorPubKey(props.author);
const store = useProfileStore();

onMounted(async () => {
    try {
        loading.value = true;
        const profile = await store.fetchAgentProfile(agentPubKey);
        if (profile) {
            nickname.value = profile.nickname;
        }
        const currentMyFollowing = await myFollowing();
        console.log('current', currentMyFollowing);
        following.value = currentMyFollowing.includes(agentPubKey);
    } catch (error) {
        showError(error);
    } finally {
        loading.value = false;
    }
});
</script>