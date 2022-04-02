<template>
  <q-btn
    size="md"
    color="secondary"
    @click="toggleFollow"
  >
    <template v-if="following">
      <div class="q-mr-sm">
        Unfollow
      </div>
      <q-icon name="svguse:/icons.svg#cat" />
    </template>
    <template v-else>
      <div class="q-mr-sm">
        Follow
      </div>
      <q-icon
        name="svguse:/icons.svg#cat"
        color="secondary"
        style="stroke: white;"
      />
    </template>
  </q-btn>
</template>

<script setup lang="ts">
import { HoloHashB64 } from '@holochain/client';
import { follow, myFollowing, unfollow } from '@/services/clutter-dna';
import { showError, showMessage } from '@/utils/notification';
import { onMounted, PropType, ref } from 'vue';

const props = defineProps({
    agentPubKey: {
        type: String as PropType<HoloHashB64>,
        required: true
    }
});

const loading = ref(false);
const following = ref(false);

onMounted(async () => {
    try {
        loading.value = true;
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
        const message = following.value ? `You're following now` : 'Not following anymore';
        showMessage(message);
    } catch (error) {
        showError(error);
    }
};
</script>