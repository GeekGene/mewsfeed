<template>
  <q-page padding>
    <q-spinner-pie
      v-if="loading"
      size="10%"
      color="primary"
    />

    <template v-else>
      <h4>{{ nickname }}'s Profile</h4>
      Bio: {{ bio }}
      Location: {{ location }}
      <q-icon
        :name="following ? 'star' : 'star_outline'"
        size="md"
        color="accent"
        class="cursor-pointer"
        @click="toggleFollow"
      />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useProfileStore } from "../services/profile-store";
import { useRoute } from "vue-router";
import { showError, showMessage } from "../utils/notification";
import { onMounted, ref } from "vue";
import { follow, myFollowing, unfollow } from "../services/clutter-dna";

const store = useProfileStore();
const route = useRoute();
const { agent } = route.params;
const loading = ref(false);
const nickname = ref("");
const bio = ref("");
const location = ref("");
const following = ref(false);
const agentPubKey = typeof agent === "string" ? agent : agent[0];

onMounted(async () => {
  try {
    loading.value = true;
    const profile = await store.fetchAgentProfile(agentPubKey);
    if (profile) {
      nickname.value = profile.nickname;
      bio.value = profile.fields.Bio;
      location.value = profile.fields.Location;
    }
    const currentMyFollowing = await myFollowing();
    following.value = currentMyFollowing.includes(agentPubKey);
  } catch (error) {
    showError(error);
  } finally {
    loading.value = false;
  }
});

const toggleFollow = async () => {
  try {
    if (following.value) {
      await unfollow(agentPubKey);
    } else {
      await follow(agentPubKey);
    }
    following.value = !following.value;
    const message = (following.value ? `You're following ` : 'You stopped following ') + nickname.value;
    showMessage(message);
  } catch (error) {
    showError(error);
  }
};
</script>